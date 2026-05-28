export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('integrationConfigs', 'settings', {
    type: Sequelize.TEXT,
    allowNull: true,
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn('integrationConfigs', 'settings');
}
