'use client';
import { useRunContext } from '../RunContext';

export default function Page() {
  const { includedCases, labels } = useRunContext();

  if (includedCases.length === 0) {
    return (
      <div className="container mx-auto max-w-3xl pt-6 px-6 flex-grow">
        <div className="w-full p-3">
          <h3 className="font-bold">{labels.noCasesFound}</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-6 px-4 flex-grow overflow-y-auto">
      <div className="w-full p-3">
        <h3 className="font-bold mb-3">
          {labels.selected} ({includedCases.length})
        </h3>
        <ul className="space-y-1">
          {includedCases.map((tc) => (
            <li
              key={tc.id}
              className="text-sm px-3 py-2 rounded-md border border-default-200 dark:border-neutral-700"
            >
              <span className="text-default-400 text-xs me-2">#{tc.id}</span>
              {tc.title}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
