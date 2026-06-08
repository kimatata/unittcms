function defineSourceCommit(sequelize, DataTypes) {
  const SourceCommit = sequelize.define('SourceCommit', {
    automationConfigId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'automationConfigs', key: 'id' },
      onDelete: 'CASCADE',
    },
    sha: { type: DataTypes.STRING(64), allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: true },
    author: { type: DataTypes.STRING, allowNull: true },
    committedAt: { type: DataTypes.DATE, allowNull: true },
    diff: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM('new', 'analyzing', 'analyzed', 'done', 'failed'),
      allowNull: false,
      defaultValue: 'new',
    },
    aiSummary: { type: DataTypes.TEXT, allowNull: true },
    generatedTestCaseIds: { type: DataTypes.TEXT, allowNull: true },
    testCommitSha: { type: DataTypes.STRING(64), allowNull: true },
  }, { tableName: 'sourceCommits' });

  SourceCommit.associate = (models) => {
    SourceCommit.belongsTo(models.AutomationConfig, { foreignKey: 'automationConfigId', onDelete: 'CASCADE' });
  };

  return SourceCommit;
}

export default defineSourceCommit;
