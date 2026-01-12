'use client';

import { useEffect, useState, useContext } from 'react';
import { Divider, Textarea, Chip, Button } from '@heroui/react';
import { TokenContext } from '@/utils/TokenProvider';
import { fetchCase } from '@/utils/caseControl';
import { logError } from '@/utils/errorHandler';
import { templates, testTypes } from '@/config/selection';
import type { CaseType, StepType } from '@/types/case';
import type { RunMessages } from '@/types/run';
import type { PriorityMessages } from '@/types/priority';
import type { TestTypeMessages } from '@/types/testType';
import TestCasePriority from '@/components/TestCasePriority';
import { Link, NextUiLinkClasses } from '@/src/i18n/routing';

type Props = {
  projectId: string;
  locale: string;
  caseId: string;
  messages: RunMessages;
  testTypeMessages: TestTypeMessages;
  priorityMessages: PriorityMessages;
};

const defaultTestCase: CaseType = {
  id: 0,
  title: '',
  state: 0,
  priority: 0,
  type: 0,
  automationStatus: 0,
  description: '',
  template: 0,
  preConditions: '',
  expectedResults: '',
  folderId: 0,
};

export default function TestCaseDetailPane({
  projectId,
  locale,
  caseId,
  messages,
  testTypeMessages,
  priorityMessages,
}: Props) {
  const context = useContext(TokenContext);
  const [isFetching, setIsFetching] = useState(false);
  const [testCase, setTestCase] = useState<CaseType>(defaultTestCase);

  useEffect(() => {
    async function fetchDataEffect() {
      if (!context.isSignedIn()) return;
      if (!caseId || caseId <= 0) return;

      setIsFetching(true);
      try {
        const data = await fetchCase(context.token.access_token, Number(caseId));
        if (data.Steps && data.Steps.length > 0) {
          data.Steps.sort((a: StepType, b: StepType) => a.caseSteps.stepNo - b.caseSteps.stepNo);
        }
        setTestCase(data);
      } catch (error: unknown) {
        logError('Error fetching case data', error);
      } finally {
        setIsFetching(false);
      }
    }

    fetchDataEffect();
  }, [context, caseId]);

  if (isFetching) {
    return <div>loading...</div>;
  }

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
          {testCase.Tags && testCase.Tags.length > 0 ? (
            testCase.Tags.map((tag) => (
              <Chip key={tag.id} size="sm" variant="flat">
                {tag.name}
              </Chip>
            ))
          ) : (
            <span>-</span>
          )}
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
          {testCase.Steps && testCase.Steps.length > 0 ? (
            testCase.Steps.map((step) => (
              <div key={step.id} className="flex gap-2 my-2">
                <div className="w-1/2">
                  <Textarea isReadOnly size="sm" variant="flat" label={messages.detailsOfTheStep} value={step.step} />
                </div>
                <div className="w-1/2">
                  <Textarea isReadOnly size="sm" variant="flat" label={messages.expectedResult} value={step.result} />
                </div>
              </div>
            ))
          ) : (
            <span>-</span>
          )}
        </>
      )}
    </div>
  );
}
