'use client';

import { useEffect, useState, useContext } from 'react';
import { Card, CardBody, Divider, Textarea, Chip, Button } from '@heroui/react';
import { ExternalLink } from 'lucide-react';
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
  caseId: number;
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

  if (!caseId || caseId <= 0) {
    return (
      <div className="h-full p-4">
        <Card shadow="none" className="h-full bg-neutral-50 dark:bg-neutral-800">
          <CardBody className="text-default-500">{messages.selectTestCase}</CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full p-4">
      <Card shadow="none" className="h-full overflow-auto bg-neutral-50 dark:bg-neutral-800">
        <CardBody className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs text-default-500">#{testCase.id}</div>
              <h3 className="text-lg font-bold">{testCase.title}</h3>
            </div>

            {testCase.folderId > 0 && (
              <Link
                href={`/projects/${projectId}/folders/${testCase.folderId}/cases/${testCase.id}`}
                locale={locale}
                className={NextUiLinkClasses}
              >
                <Button size="sm" variant="bordered" startContent={<ExternalLink size={16} />}>
                  Open
                </Button>
              </Link>
            )}
          </div>

          <Divider />

          <div>
            <p className="font-bold mt-2">{messages.description}</p>
            <div className="text-default-700 dark:text-default-200 whitespace-pre-wrap">
              {isFetching ? messages.updating : testCase.description || '-'}
            </div>
          </div>

          <div className="flex gap-6">
            <div className="min-w-40">
              <p className="font-bold">{messages.priority}</p>
              <TestCasePriority priorityValue={testCase.priority} priorityMessages={priorityMessages} />
            </div>

            <div className="min-w-40">
              <p className="font-bold">{messages.type}</p>
              <div>{testTypeMessages[testTypes[testCase.type].uid]}</div>
            </div>
          </div>

          <div>
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

          <Divider />

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
                      <Textarea
                        isReadOnly
                        size="sm"
                        variant="flat"
                        label={messages.detailsOfTheStep}
                        value={step.step}
                      />
                    </div>
                    <div className="w-1/2">
                      <Textarea
                        isReadOnly
                        size="sm"
                        variant="flat"
                        label={messages.expectedResult}
                        value={step.result}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <span>-</span>
              )}
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
