'use client';
import { useState, useEffect, useContext, useCallback } from 'react';
import { Button, Divider } from '@heroui/react';
import {
  RefreshCw, BarChart3, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import { TokenContext } from '@/utils/TokenProvider';
import { MonitorMessages, TestHealthData } from '@/types/project';
import { fetchTestHealth } from '@/utils/monitorControl';
import { fetchAutomationConfig } from '@/utils/automationConfigControl';
import { logError } from '@/utils/errorHandler';

type Props = {
  projectId: string;
  messages: MonitorMessages;
};

function cellColor(cell: { total: number; passed: number; failed: number } | undefined): string {
  if (!cell || cell.total === 0) return 'bg-default-100 dark:bg-neutral-800';
  if (cell.failed > 0) return 'bg-danger-100 dark:bg-danger-900/30 text-danger-700';
  return 'bg-success-100 dark:bg-success-900/30 text-success-700';
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' +
    d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export default function MonitorPage({ projectId, messages }: Props) {
  const context = useContext(TokenContext);
  const jwt = context.token.access_token;

  const [healthData, setHealthData] = useState<TestHealthData | null>(null);

  const loadAll = useCallback(async () => {
    if (!jwt) return;
    try {
      const cfg = await fetchAutomationConfig(jwt, Number(projectId));
      if (!cfg) return;
      const healthRaw = await fetchTestHealth(jwt, cfg.id).catch(() => null as TestHealthData | null);
      setHealthData(healthRaw);
    } catch (err) {
      logError('MonitorPage load', err);
    }
  }, [jwt, projectId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  return (
    <div className="container mx-auto max-w-4xl pt-6 px-6 flex-grow">
      <div className="w-full p-3 flex items-center justify-between mb-2">
        <h3 className="font-bold">{messages.monitor}</h3>
        <Button size="sm" variant="light" isIconOnly onPress={loadAll}>
          <RefreshCw size={14} />
        </Button>
      </div>

      {/* Test Health Matrix */}
      <Divider className="my-2" />
      <div className="w-full p-3 flex flex-col gap-3 mt-2 mb-8">
        <h4 className="font-semibold text-sm text-default-600 uppercase tracking-wide flex items-center gap-2">
          <BarChart3 size={14} />
          {messages.testHealthSection}
        </h4>

        {(!healthData || healthData.runs.length === 0) && (
          <p className="text-sm text-default-400">{messages.noRunsForMatrix}</p>
        )}

        {healthData && healthData.runs.length > 0 && healthData.folders.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-2 text-default-500 font-medium min-w-32">Folder</th>
                  {healthData.runs.map((run) => (
                    <th key={run.id} className="text-center p-2 text-default-500 font-medium min-w-20 max-w-24">
                      <div className="truncate" title={run.name}>{run.name}</div>
                      <div className="text-default-300 font-normal">{formatDate(run.updatedAt)}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {healthData.folders.map((folder) => (
                  <tr key={folder.id} className="border-t-1 dark:border-neutral-700">
                    <td className="p-2 font-medium text-default-700 truncate max-w-32" title={folder.name}>
                      {folder.name}
                    </td>
                    {healthData.runs.map((run) => {
                      const cell = healthData.matrix[folder.id]?.[run.id];
                      const colorClass = cellColor(cell);
                      return (
                        <td key={run.id} className={`p-2 text-center rounded ${colorClass}`}>
                          {cell && cell.total > 0 ? (
                            <span title={`${cell.passed} passed · ${cell.failed} failed · ${cell.skipped} skipped`} className="cursor-default">
                              {cell.failed > 0
                                ? <AlertTriangle size={12} className="inline" />
                                : <CheckCircle2 size={12} className="inline" />
                              }
                              {' '}{cell.passed}/{cell.total}
                            </span>
                          ) : (
                            <span className="text-default-300">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
