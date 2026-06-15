'use client';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  ReactFlow,
  type Node,
  type Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  type NodeChange,
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { SprintFlow, SprintBranchInfo } from '@/types/project';
import BranchNode from './nodes/BranchNode';
import VersionBranchNode from './nodes/VersionBranchNode';
import TestPlanNode from './nodes/TestPlanNode';
import TicketNode from './nodes/TicketNode';

const nodeTypes: NodeTypes = {
  branch: BranchNode as NodeTypes[string],
  version: VersionBranchNode as NodeTypes[string],
  testPlan: TestPlanNode as NodeTypes[string],
  ticket: TicketNode as NodeTypes[string],
};

type Props = {
  flow: SprintFlow;
  selectedNodeId: string | null;
  onNodeClick: (nodeId: string, nodeType: string) => void;
  onPositionsChange: (positions: Record<string, { x: number; y: number }>) => void;
  onGenerateClick: () => void;
};

function buildInitialLayout(
  branches: SprintBranchInfo[],
  versionBranch: string | null,
  savedPositions: Record<string, { x: number; y: number }>,
  flowStatus: string,
  draft: SprintFlow['testPlanDraft'],
  onGenerate: () => void
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const branchesWithPR = branches.filter((b) => b.prTargetBranch === versionBranch || !versionBranch);
  const colCount = Math.max(1, Math.min(branchesWithPR.length, 5));
  const spacing = 220;

  // Group branches by ticket ID for ticket nodes
  const ticketGroups: Record<string, SprintBranchInfo[]> = {};
  const noTicketBranches: SprintBranchInfo[] = [];
  branches.forEach((b) => {
    if (b.ticketId) {
      if (!ticketGroups[b.ticketId]) ticketGroups[b.ticketId] = [];
      ticketGroups[b.ticketId].push(b);
    } else {
      noTicketBranches.push(b);
    }
  });

  let colIdx = 0;

  // Ticket nodes (row 0)
  Object.entries(ticketGroups).forEach(([ticketId, tBranches]) => {
    const ticketNodeId = `ticket-${ticketId}`;
    const x = savedPositions[ticketNodeId]?.x ?? colIdx * spacing;
    const y = savedPositions[ticketNodeId]?.y ?? 0;
    nodes.push({
      id: ticketNodeId,
      type: 'ticket',
      position: { x, y },
      data: { ticketId },
    });

    // Branch nodes for this ticket (row 1)
    tBranches.forEach((b, bIdx) => {
      const branchNodeId = `branch-${b.name}`;
      const bx = savedPositions[branchNodeId]?.x ?? (colIdx + bIdx) * spacing;
      const by = savedPositions[branchNodeId]?.y ?? 180;
      const mergedCount = branches.filter((br) => br.prState === 'merged').length;
      nodes.push({
        id: branchNodeId,
        type: 'branch',
        position: { x: bx, y: by },
        data: { branch: b, isSelected: false },
      });
      edges.push({
        id: `e-ticket-${ticketId}-${b.name}`,
        source: ticketNodeId,
        target: branchNodeId,
        style: { stroke: '#93c5fd', strokeWidth: 1.5, strokeDasharray: '4 2' },
        animated: b.prState === 'open',
      });
    });

    colIdx += tBranches.length;
  });

  // Non-ticket branches (row 1 only, no ticket node)
  noTicketBranches.forEach((b, idx) => {
    const branchNodeId = `branch-${b.name}`;
    const bx = savedPositions[branchNodeId]?.x ?? (colIdx + idx) * spacing;
    const by = savedPositions[branchNodeId]?.y ?? 180;
    nodes.push({
      id: branchNodeId,
      type: 'branch',
      position: { x: bx, y: by },
      data: { branch: b, isSelected: false },
    });
    colIdx++;
  });

  const mergedCount = branches.filter((b) => b.prState === 'merged').length;
  const totalBranches = branches.length;
  const allMerged = mergedCount >= totalBranches && totalBranches > 0;

  // Version branch node (row 2)
  if (versionBranch) {
    const vNodeId = `version-${versionBranch}`;
    const centerX = ((colIdx - 1) * spacing) / 2;
    const vx = savedPositions[vNodeId]?.x ?? centerX;
    const vy = savedPositions[vNodeId]?.y ?? 380;

    nodes.push({
      id: vNodeId,
      type: 'version',
      position: { x: vx, y: vy },
      data: {
        branchName: versionBranch,
        totalBranches,
        mergedCount,
        canGenerate: allMerged && flowStatus === 'active',
        flowStatus,
        onGenerate,
      },
    });

    // Edges from each branch to version branch
    branches.forEach((b) => {
      edges.push({
        id: `e-branch-${b.name}-version`,
        source: `branch-${b.name}`,
        target: vNodeId,
        style: {
          stroke: b.prState === 'merged' ? '#a855f7' : '#6b7280',
          strokeWidth: b.prState === 'merged' ? 2 : 1.5,
          strokeDasharray: b.prState === 'merged' ? undefined : '5 3',
        },
        animated: b.prState === 'open',
        label: b.prState === 'merged' ? '✓' : b.prState === 'open' ? 'PR open' : '',
        labelStyle: { fontSize: 10, fill: b.prState === 'merged' ? '#a855f7' : '#9ca3af' },
      });
    });

    // Test plan node (row 3) if draft or beyond
    if (['draft', 'testing'].includes(flowStatus)) {
      const tpNodeId = 'testplan-node';
      const tpx = savedPositions[tpNodeId]?.x ?? centerX;
      const tpy = savedPositions[tpNodeId]?.y ?? 560;
      const caseCount = draft ? draft.reduce((s, f) => s + f.cases.length, 0) : 0;
      const folderCount = draft?.length ?? 0;

      nodes.push({
        id: tpNodeId,
        type: 'testPlan',
        position: { x: tpx, y: tpy },
        data: {
          status: flowStatus === 'testing' ? 'approved' : 'draft',
          caseCount,
          folderCount,
        },
      });

      edges.push({
        id: 'e-version-testplan',
        source: vNodeId,
        target: tpNodeId,
        style: { stroke: '#14b8a6', strokeWidth: 2 },
        animated: false,
      });
    }
  }

  return { nodes, edges };
}

export default function SprintBoard({ flow, selectedNodeId, onNodeClick, onPositionsChange, onGenerateClick }: Props) {
  const positionDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    return buildInitialLayout(
      flow.branchSnapshot,
      flow.versionBranch,
      flow.nodePositions,
      flow.status,
      flow.testPlanDraft,
      onGenerateClick
    );
  }, [flow.id]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Rebuild nodes when flow updates (status change, new branches, etc.)
  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = buildInitialLayout(
      flow.branchSnapshot,
      flow.versionBranch,
      flow.nodePositions,
      flow.status,
      flow.testPlanDraft,
      onGenerateClick
    );
    setNodes(newNodes);
    setEdges(newEdges);
  }, [flow.status, flow.branchSnapshot.length, flow.versionBranch]);

  // Highlight selected node
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        selected: n.id === selectedNodeId,
      }))
    );
  }, [selectedNodeId, setNodes]);

  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    onNodesChange(changes);

    const hasMove = changes.some((c) => c.type === 'position' && c.dragging === false);
    if (hasMove) {
      if (positionDebounce.current) clearTimeout(positionDebounce.current);
      positionDebounce.current = setTimeout(() => {
        setNodes((current) => {
          const positions: Record<string, { x: number; y: number }> = {};
          current.forEach((n) => { positions[n.id] = { x: n.position.x, y: n.position.y }; });
          onPositionsChange(positions);
          return current;
        });
      }, 800);
    }
  }, [onNodesChange, onPositionsChange, setNodes]);

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    onNodeClick(node.id, node.type || '');
  }, [onNodeClick]);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.3}
        maxZoom={2}
        defaultEdgeOptions={{ type: 'smoothstep' }}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e5e7eb" />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={(n) => {
            if (n.type === 'version') return '#22c55e';
            if (n.type === 'ticket') return '#3b82f6';
            if (n.type === 'testPlan') return '#14b8a6';
            return '#86efac';
          }}
          maskColor="rgba(0,0,0,0.05)"
        />
      </ReactFlow>
    </div>
  );
}
