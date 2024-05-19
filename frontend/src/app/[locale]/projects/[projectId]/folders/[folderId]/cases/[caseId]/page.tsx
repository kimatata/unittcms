import CaseEditor from './CaseEditor';
import { useTranslations } from 'next-intl';

export default function Page({
  params,
}: {
  params: {
    projectId: string;
    folderId: string;
    caseId: string;
    locale: string;
  };
}) {
  const t = useTranslations('Case');
  const messages = {
    backToCases: t('back_to_cases'),
    updating: t('updating'),
    update: t('update'),
    basic: t('basic'),
    title: t('title'),
    pleaseEnterTitle: t('please_enter_title'),
    description: t('description'),
    testCaseDescription: t('test_case_description'),
    priority: t('priority'),
    critical: t('critical'),
    high: t('high'),
    medium: t('medium'),
    low: t('low'),
    type: t('type'),
    other: t('other'),
    security: t('security'),
    performance: t('performance'),
    accessibility: t('accessibility'),
    functional: t('functional'),
    acceptance: t('acceptance'),
    usability: t('usability'),
    smokeSanity: t('smoke_sanity'),
    compatibility: t('compatibility'),
    destructive: t('destructive'),
    regression: t('regression'),
    automated: t('automated'),
    manual: t('manual'),
    template: t('template'),
    testDetail: t('test_detail'),
    preconditions: t('preconditions'),
    step: t('step'),
    text: t('text'),
    steps: t('steps'),
    newStep: t('new_step'),
    detailsOfTheStep: t('details_of_the_step'),
    expectedResult: t('expected_result'),
    deleteThisStep: t('delete_this_step'),
    insertStep: t('insert_step'),
    attachments: t('attachments'),
    delete: t('delete'),
    download: t('download'),
    deleteFile: t('delete_file'),
    clickToUpload: t('click_to_upload'),
    orDragAndDrop: t('or_drag_and_drop'),
    maxFileSize: t('max_file_size'),
  };

  return (
    <CaseEditor
      projectId={params.projectId}
      folderId={params.folderId}
      caseId={params.caseId}
      messages={messages}
      locale={params.locale}
    />
  );
}
