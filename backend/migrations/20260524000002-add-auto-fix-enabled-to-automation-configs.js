export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('automationConfigs', 'autoFixEnabled', {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn('automationConfigs', 'autoFixEnabled');
}
