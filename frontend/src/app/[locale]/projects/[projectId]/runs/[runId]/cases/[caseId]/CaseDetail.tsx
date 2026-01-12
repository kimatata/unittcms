'use client';

import { Textarea, Chip } from '@heroui/react';
import { templates, testTypes } from '@/config/selection';
import type { CaseType } from '@/types/case';
import type { RunDetailMessages } from '@/types/run';
import type { PriorityMessages } from '@/types/priority';
import type { TestTypeMessages } from '@/types/testType';
import TestCasePriority from '@/components/TestCasePriority';
import { Link, NextUiLinkClasses } from '@/src/i18n/routing';

type Props = {
  projectId: string;
  testCase: CaseType;
  locale: string;
  messages: RunDetailMessages;
  testTypeMessages: TestTypeMessages;
  priorityMessages: PriorityMessages;
};

export default function CaseDetail({
  projectId,
  testCase,
  locale,
  messages,
  testTypeMessages,
  priorityMessages,
}: Props) {
  return (
    <div className="h-full p-4 text-default-500">
      <div className="mb-4">
        <Link
          href={`/projects/${projectId}/folders/${testCase.folderId}/cases/${testCase.id}`}
          locale={locale}
          className={`${NextUiLinkClasses}`}
        >
          #{testCase.id} {testCase.title}
        </Link>
      </div>

      <div className="mb-4">
        <p className="font-bold">{messages.description}</p>
        <div>{testCase.description}</div>
      </div>

      <div className="mb-4">
        <p className="font-bold">{messages.priority}</p>
        <TestCasePriority priorityValue={testCase.priority} priorityMessages={priorityMessages} />
      </div>

      <div className="mb-4">
        <p className="font-bold">{messages.type}</p>
        <div>{testTypeMessages[testTypes[testCase.type].uid]}</div>
      </div>

      <div className="mb-4">
        <p className="font-bold">{messages.tags}</p>
        <div className="flex gap-1 flex-wrap mt-1">
          {testCase.Tags &&
            testCase.Tags.length > 0 &&
            testCase.Tags.map((tag) => (
              <Chip key={tag.id} size="sm" variant="flat">
                {tag.name}
              </Chip>
            ))}
        </div>
      </div>

      {templates[testCase.template].uid === 'text' ? (
        <>
          <p className="font-bold mt-2">{messages.testDetail}</p>
          <div className="flex gap-2 my-2">
            <div className="w-1/2">
              <Textarea
                isReadOnly
                size="sm"
                variant="flat"
                label={messages.preconditions}
                value={testCase.preConditions}
              />
            </div>
            <div className="w-1/2">
              <Textarea
                isReadOnly
                size="sm"
                variant="flat"
                label={messages.expectedResult}
                value={testCase.expectedResults}
              />
            </div>
          </div>
        </>
      ) : (
        <>
          <p className="font-bold mt-2">{messages.steps}</p>
          {testCase.Steps &&
            testCase.Steps.length > 0 &&
            testCase.Steps.map((step) => (
              <div key={step.id} className="flex gap-2 my-2">
                <div className="w-1/2">
                  <Textarea isReadOnly size="sm" variant="flat" label={messages.detailsOfTheStep} value={step.step} />
                </div>
                <div className="w-1/2">
                  <Textarea isReadOnly size="sm" variant="flat" label={messages.expectedResult} value={step.result} />
                </div>
              </div>
            ))}
        </>
      )}
    </div>
  );
}
