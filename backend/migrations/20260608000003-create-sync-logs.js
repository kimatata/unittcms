export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('syncLogs', {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    automationConfigId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'automationConfigs', key: 'id' },
      onDelete: 'CASCADE',
    },
    type: {
      type: Sequelize.ENUM('commit_sync', 'ai_analysis', 'test_sync', 'webhook'),
      allowNull: false,
    },
    commitSha: { type: Sequelize.STRING(64), allowNull: true },
    description: { type: Sequelize.TEXT, allowNull: true },
    created: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
    updated: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
    orphaned: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
    status: {
      type: Sequelize.ENUM('success', 'failed'),
      allowNull: false,
      defaultValue: 'success',
    },
    errorMessage: { type: Sequelize.TEXT, allowNull: true },
    createdAt: { type: Sequelize.DATE, allowNull: false },
    updatedAt: { type: Sequelize.DATE, allowNull: false },
  });

  await queryInterface.addIndex('syncLogs', ['automationConfigId']);
}

export async function down(queryInterface) {
  await queryInterface.dropTable('syncLogs');
}
