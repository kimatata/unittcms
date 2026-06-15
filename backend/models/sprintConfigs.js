function defineSprintConfig(sequelize, DataTypes) {
  const SprintConfig = sequelize.define('SprintConfig', {
    automationConfigId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: { model: 'automationConfigs', key: 'id' },
      onDelete: 'CASCADE',
    },
    keyBranchPatterns: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '["main","master","develop"]',
    },
    sprintBranchPattern: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
    jiraBaseUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    jiraProjectKey: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: null,
    },
    branchTicketRegex: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: '([A-Z]+-[0-9]+)',
    },
    sourceBranch: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
    deploymentFlow: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: null,
    },
  }, { tableName: 'sprintConfigs' });

  SprintConfig.associate = (models) => {
    SprintConfig.belongsTo(models.AutomationConfig, { foreignKey: 'automationConfigId', onDelete: 'CASCADE' });
  };

  return SprintConfig;
}

export default defineSprintConfig;
