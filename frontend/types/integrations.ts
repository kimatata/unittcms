export type IntegrationConfigType = {
  id: number;
  projectId: number;
  service: string;
  apiKey: string;
  createdAt: string;
  updatedAt: string;
};

export type IntegrationsMessages = {
  integrations: string;
  aiProviders: string;
  anthropic: string;
  anthropicDescription: string;
  apiKey: string;
  apiKeyPlaceholder: string;
  saveKey: string;
  saving: string;
  deleteKey: string;
  noIntegrations: string;
  successSaved: string;
  errorSaved: string;
  successDeleted: string;
  errorDeleted: string;
  connected: string;
  notConfigured: string;
  close: string;
  delete: string;
  areYouSure: string;
  edit: string;
  cancel: string;
};
