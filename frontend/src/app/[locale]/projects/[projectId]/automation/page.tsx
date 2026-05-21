import { useTranslations } from 'next-intl';
import AutomationPage from './AutomationPage';
import { AutomationMessages } from '@/types/project';

export default function Page({ params: { projectId } }: { params: { projectId: string } }) {
  const t = useTranslations('Automation');
  const messages: AutomationMessages = {
    automation: t('automation'),
    gitlabConnection: t('gitlab_connection'),
    gitlabUrl: t('gitlab_url'),
    gitlabToken: t('gitlab_token'),
    gitlabNamespace: t('gitlab_namespace'),
    repoConfig: t('repo_config'),
    repoName: t('repo_name'),
    automationTool: t('automation_tool'),
    automationLanguage: t('automation_language'),
    saveConfig: t('save_config'),
    generateProject: t('generate_project'),
    generating: t('generating'),
    repoUrl: t('repo_url'),
    connected: t('connected'),
    notConnected: t('not_connected'),
    toolPlaywright: t('tool_playwright'),
    toolCypress: t('tool_cypress'),
    toolPytest: t('tool_pytest'),
    langTypescript: t('lang_typescript'),
    langJavascript: t('lang_javascript'),
    langPython: t('lang_python'),
    successSaved: t('success_saved'),
    successGenerated: t('success_generated'),
    errorSaved: t('error_saved'),
    errorGenerated: t('error_generated'),
    openRepo: t('open_repo'),
    gitlabUrlPlaceholder: t('gitlab_url_placeholder'),
    gitlabTokenPlaceholder: t('gitlab_token_placeholder'),
    repoNamePlaceholder: t('repo_name_placeholder'),
    provider: t('provider'),
    providerGitlab: t('provider_gitlab'),
    providerGithub: t('provider_github'),
    instanceUrl: t('instance_url'),
    githubUrlPlaceholder: t('github_url_placeholder'),
    githubTokenPlaceholder: t('github_token_placeholder'),
  };

  return <AutomationPage projectId={projectId} messages={messages} />;
}
