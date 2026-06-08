function defineAutomationConfig(sequelize, DataTypes) {
  const AutomationConfig = sequelize.define('AutomationConfig', {
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'projects',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    gitlabUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    gitlabToken: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    gitlabNamespace: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    repoName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    repoUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    repoId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    automationTool: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'playwright',
    },
    automationLanguage: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'typescript',
    },
    provider: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'gitlab',
    },
    autoFixEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    sourceRepoOwner: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    sourceRepoName: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    sourceRepoBranch: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'main',
    },
    webhookSecret: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    autoAnalyzeCommits: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    sourceProvider: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: null,
    },
  }, { tableName: 'automationConfigs' });

  AutomationConfig.associate = (models) => {
    AutomationConfig.belongsTo(models.Project, { foreignKey: 'projectId', onDelete: 'CASCADE' });
  };

  return AutomationConfig;
}

export default defineAutomationConfig;
