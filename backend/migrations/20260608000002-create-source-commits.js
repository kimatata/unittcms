export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('sourceCommits', {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    automationConfigId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'automationConfigs', key: 'id' },
      onDelete: 'CASCADE',
    },
    sha: { type: Sequelize.STRING(64), allowNull: false },
    message: { type: Sequelize.TEXT, allowNull: true },
    author: { type: Sequelize.STRING, allowNull: true },
    committedAt: { type: Sequelize.DATE, allowNull: true },
    diff: { type: Sequelize.TEXT, allowNull: true },
    status: {
      type: Sequelize.ENUM('new', 'analyzing', 'analyzed', 'done', 'failed'),
      allowNull: false,
      defaultValue: 'new',
    },
    aiSummary: { type: Sequelize.TEXT, allowNull: true },
    generatedTestCaseIds: { type: Sequelize.TEXT, allowNull: true },
    testCommitSha: { type: Sequelize.STRING(64), allowNull: true },
    createdAt: { type: Sequelize.DATE, allowNull: false },
    updatedAt: { type: Sequelize.DATE, allowNull: false },
  });

  await queryInterface.addIndex('sourceCommits', ['automationConfigId']);
  await queryInterface.addIndex('sourceCommits', ['automationConfigId', 'sha'], { unique: true });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('sourceCommits');
}
