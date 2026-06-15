export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('sprintFlows', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    automationConfigId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'automationConfigs', key: 'id' },
      onDelete: 'CASCADE',
    },
    title: {
      type: Sequelize.STRING(255),
      allowNull: false,
      defaultValue: '',
    },
    baseBranch: {
      type: Sequelize.STRING(100),
      allowNull: false,
      defaultValue: 'main',
    },
    versionBranch: {
      type: Sequelize.STRING(100),
      allowNull: true,
      defaultValue: null,
    },
    jiraSprintId: {
      type: Sequelize.STRING(100),
      allowNull: true,
      defaultValue: null,
    },
    jiraSprintTitle: {
      type: Sequelize.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
    testRunId: {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: null,
      references: { model: 'runs', key: 'id' },
      onDelete: 'SET NULL',
    },
    status: {
      type: Sequelize.STRING(50),
      allowNull: false,
      defaultValue: 'active',
    },
    branchSnapshot: {
      type: Sequelize.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    nodePositions: {
      type: Sequelize.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    testPlanDraft: {
      type: Sequelize.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    generationPrompt: {
      type: Sequelize.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    generationLogs: {
      type: Sequelize.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
  });

  await queryInterface.addIndex('sprintFlows', ['automationConfigId']);
}

export async function down(queryInterface) {
  await queryInterface.dropTable('sprintFlows');
}
