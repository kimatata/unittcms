export async function up(queryInterface, Sequelize) {
  await queryInterface.changeColumn('automationConfigs', 'gitlabToken', {
    type: Sequelize.STRING,
    allowNull: true,
    defaultValue: null,
  });
  await queryInterface.changeColumn('automationConfigs', 'gitlabUrl', {
    type: Sequelize.STRING,
    allowNull: true,
    defaultValue: null,
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.changeColumn('automationConfigs', 'gitlabToken', {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: '',
  });
  await queryInterface.changeColumn('automationConfigs', 'gitlabUrl', {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: 'https://gitlab.com',
  });
}
