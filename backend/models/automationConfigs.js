function defineAutomationConfig(sequelize, DataTypes) {
  const AutomationConfig = sequelize.define('AutomationConfig', {
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Projects',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    gitlabUrl: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'https://gitlab.com',
    },
    gitlabToken: {
      type: DataTypes.STRING,
      allowNull: false,
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
  });

  AutomationConfig.associate = (models) => {
    AutomationConfig.belongsTo(models.Project, { foreignKey: 'projectId', onDelete: 'CASCADE' });
  };

  return AutomationConfig;
}

export default defineAutomationConfig;
