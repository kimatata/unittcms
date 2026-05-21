export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('AutomationConfigs', 'provider', {
    type: Sequelize.STRING(20),
    allowNull: false,
    defaultValue: 'gitlab',
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn('AutomationConfigs', 'provider');
}
