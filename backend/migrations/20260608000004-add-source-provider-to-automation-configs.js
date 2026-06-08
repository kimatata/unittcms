export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('automationConfigs', 'sourceProvider', {
    type: Sequelize.STRING(20),
    allowNull: true,
    defaultValue: null,
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn('automationConfigs', 'sourceProvider');
}
