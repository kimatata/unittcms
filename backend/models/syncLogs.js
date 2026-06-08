function defineSyncLog(sequelize, DataTypes) {
  const SyncLog = sequelize.define('SyncLog', {
    automationConfigId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'automationConfigs', key: 'id' },
      onDelete: 'CASCADE',
    },
    type: {
      type: DataTypes.ENUM('commit_sync', 'ai_analysis', 'test_sync', 'webhook'),
      allowNull: false,
    },
    commitSha: { type: DataTypes.STRING(64), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    created: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    updated: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    orphaned: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    status: {
      type: DataTypes.ENUM('success', 'failed'),
      allowNull: false,
      defaultValue: 'success',
    },
    errorMessage: { type: DataTypes.TEXT, allowNull: true },
  }, { tableName: 'syncLogs' });

  SyncLog.associate = (models) => {
    SyncLog.belongsTo(models.AutomationConfig, { foreignKey: 'automationConfigId', onDelete: 'CASCADE' });
  };

  return SyncLog;
}

export default defineSyncLog;
