import { useTranslations } from 'next-intl';
import IntegrationsPage from './IntegrationsPage';
import { IntegrationsMessages } from '@/types/integrations';

export default function Page({ params }: { params: { projectId: string } }) {
  const t = useTranslations('Integrations');
  const messages: IntegrationsMessages = {
    integrations: t('integrations'),
    aiProviders: t('ai_providers'),
    anthropic: t('anthropic'),
    anthropicDescription: t('anthropic_description'),
    apiKey: t('api_key'),
    apiKeyPlaceholder: t('api_key_placeholder'),
    saveKey: t('save_key'),
    saving: t('saving'),
    deleteKey: t('delete_key'),
    noIntegrations: t('no_integrations'),
    successSaved: t('success_saved'),
    errorSaved: t('error_saved'),
    successDeleted: t('success_deleted'),
    errorDeleted: t('error_deleted'),
    connected: t('connected'),
    notConfigured: t('not_configured'),
    close: t('close'),
    delete: t('delete'),
    areYouSure: t('are_you_sure'),
    edit: t('edit'),
    cancel: t('cancel'),
    gitProviders: t('git_providers'),
    github: t('github'),
    githubDescription: t('github_description'),
    gitlab: t('gitlab'),
    gitlabDescription: t('gitlab_description'),
    token: t('token'),
    githubTokenPlaceholder: t('github_token_placeholder'),
    gitlabTokenPlaceholder: t('gitlab_token_placeholder'),
    instanceUrl: t('instance_url'),
    namespace: t('namespace'),
    namespacePlaceholder: t('namespace_placeholder'),
  };

  return <IntegrationsPage projectId={params.projectId} messages={messages} />;
}
