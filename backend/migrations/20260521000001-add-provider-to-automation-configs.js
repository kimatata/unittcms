export async function up(queryInterface, Sequelize) {
  const table = await queryInterface.describeTable('automationConfigs');
  if (!table.provider) {
    await queryInterface.addColumn('automationConfigs', 'provider', {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: 'gitlab',
    });
  }
}

export async function down(queryInterface) {
  await queryInterface.removeColumn('automationConfigs', 'provider');
}
