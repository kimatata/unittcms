export function createRepositories(db) {
  return {
    users: db.models.User,
    projects: db.models.Project,
    folders: db.models.Folder,
    cases: db.models.Case,
    runs: db.models.Run,
    runCases: db.models.RunCase,
    members: db.models.Member,
    tags: db.models.Tags,
    steps: db.models.Step,
    attachments: db.models.Attachment,
    caseSteps: db.models.CaseStep,
    caseTags: db.models.caseTags,
    caseAttachments: db.models.CaseAttachment,
    comments: db.models.Comment,
    automationConfigs: db.models.AutomationConfig,
    integrationConfigs: db.models.IntegrationConfig,
    sourceCommits: db.models.SourceCommit,
    syncLogs: db.models.SyncLog,
  };
}
