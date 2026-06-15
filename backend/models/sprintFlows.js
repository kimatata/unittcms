function defineSprintFlow(sequelize, DataTypes) {
  const SprintFlow = sequelize.define('SprintFlow', {
    automationConfigId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'automationConfigs', key: 'id' },
      onDelete: 'CASCADE',
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: '',
    },
    baseBranch: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'main',
    },
    versionBranch: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: null,
    },
    jiraSprintId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: null,
    },
    jiraSprintTitle: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
    testRunId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'active',
    },
    branchSnapshot: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    nodePositions: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    testPlanDraft: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    generationPrompt: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    generationLogs: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
  }, { tableName: 'sprintFlows' });

  SprintFlow.associate = (models) => {
    SprintFlow.belongsTo(models.AutomationConfig, { foreignKey: 'automationConfigId', onDelete: 'CASCADE' });
  };

  return SprintFlow;
}

export default defineSprintFlow;
