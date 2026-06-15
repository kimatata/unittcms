'use client';
import { useState, useEffect, useRef } from 'react';
import { Button, Textarea } from '@heroui/react';
import { Send, RotateCcw } from 'lucide-react';
import { SprintGenerationLogEntry, SprintDraftFolder, SprintFlow } from '@/types/project';
import PipelineTaskRow from './PipelineTaskRow';
import { prepareGeneration, streamGeneration } from '@/utils/sprintControl';
import { logError } from '@/utils/errorHandler';

type Props = {
  jwt: string;
  flow: SprintFlow;
  onComplete: (folders: SprintDraftFolder[]) => void;
};

export default function GenerationPipeline({ jwt, flow, onComplete }: Props) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPreparing, setIsPreparing] = useState(true);
  const [logs, setLogs] = useState<SprintGenerationLogEntry[]>(flow.generationLogs || []);
  const [isStreaming, setIsStreaming] = useState(false);
  const cancelRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsPreparing(true);
      try {
        const prep = await prepareGeneration(jwt, flow.id);
        setPrompt(flow.generationPrompt || prep.savedPrompt || prep.defaultPrompt);
      } catch (err) {
        logError('GenerationPipeline prepare', err);
      } finally {
        setIsPreparing(false);
      }
    };
    load();
    // Restore logs from flow if they exist
    if (flow.generationLogs?.length) {
      setLogs(flow.generationLogs);
    }
  }, [flow.id]);

  const handleSend = () => {
    if (!prompt.trim() || isStreaming) return;
    setIsStreaming(true);
    setLogs([]);

    cancelRef.current = streamGeneration(
      jwt,
      flow.id,
      prompt,
      (entry) => {
        const typedEntry = entry as SprintGenerationLogEntry;
        setLogs((prev) => {
          const existing = prev.findIndex((e) => e.task === typedEntry.task && e.status === 'running');
          if (existing >= 0) {
            const updated = [...prev];
            updated[existing] = typedEntry;
            return updated;
          }
          return [...prev, typedEntry];
        });
      },
      (result) => {
        setIsStreaming(false);
        onComplete(result.folders);
      },
      (errMsg) => {
        setIsStreaming(false);
        setLogs((prev) => [...prev, { task: 'Error', status: 'failed' as const, output: errMsg, durationMs: 0, ts: Date.now() }]);
      }
    );
  };

  const handleCancel = () => {
    cancelRef.current?.();
    setIsStreaming(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-default-200 dark:border-neutral-700">
        <h3 className="font-semibold text-sm mb-1">Generate Test Plan</h3>
        <p className="text-xs text-default-400">Customize the prompt and send to Claude</p>
      </div>

      {/* Prompt editor */}
      <div className="p-4 border-b border-default-200 dark:border-neutral-700">
        <div className="text-xs font-medium text-default-500 mb-2 uppercase tracking-wide">Prompt</div>
        {isPreparing ? (
          <div className="h-32 bg-default-100 dark:bg-neutral-800 rounded-lg animate-pulse" />
        ) : (
          <Textarea
            value={prompt}
            onValueChange={setPrompt}
            variant="bordered"
            size="sm"
            minRows={6}
            maxRows={16}
            classNames={{ input: 'font-mono text-xs' }}
            isDisabled={isStreaming}
          />
        )}
        <div className="flex gap-2 mt-3">
          <Button
            size="sm"
            color="primary"
            startContent={<Send size={13} />}
            onPress={handleSend}
            isLoading={isStreaming}
            isDisabled={!prompt.trim() || isPreparing}
          >
            {isStreaming ? 'Generating...' : 'Send to Claude'}
          </Button>
          {isStreaming && (
            <Button size="sm" variant="flat" onPress={handleCancel}>Cancel</Button>
          )}
          {!isStreaming && logs.length > 0 && (
            <Button size="sm" variant="light" startContent={<RotateCcw size={12} />} onPress={() => setLogs([])}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Task pipeline */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="text-xs font-medium text-default-500 mb-3 uppercase tracking-wide">Pipeline</div>
        {logs.length === 0 && !isStreaming && (
          <p className="text-xs text-default-400">Pipeline tasks will appear here when you send to Claude.</p>
        )}
        <div className="flex flex-col">
          {logs.map((entry, i) => (
            <PipelineTaskRow key={`${entry.task}-${i}`} entry={entry} />
          ))}
        </div>
      </div>
    </div>
  );
}
