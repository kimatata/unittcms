export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('automationConfigs', 'sourceRepoOwner', {
    type: Sequelize.STRING,
    allowNull: true,
    defaultValue: null,
  });
  await queryInterface.addColumn('automationConfigs', 'sourceRepoName', {
    type: Sequelize.STRING,
    allowNull: true,
    defaultValue: null,
  });
  await queryInterface.addColumn('automationConfigs', 'sourceRepoBranch', {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: 'main',
  });
  await queryInterface.addColumn('automationConfigs', 'webhookSecret', {
    type: Sequelize.STRING,
    allowNull: true,
    defaultValue: null,
  });
  await queryInterface.addColumn('automationConfigs', 'autoAnalyzeCommits', {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn('automationConfigs', 'sourceRepoOwner');
  await queryInterface.removeColumn('automationConfigs', 'sourceRepoName');
  await queryInterface.removeColumn('automationConfigs', 'sourceRepoBranch');
  await queryInterface.removeColumn('automationConfigs', 'webhookSecret');
  await queryInterface.removeColumn('automationConfigs', 'autoAnalyzeCommits');
}
