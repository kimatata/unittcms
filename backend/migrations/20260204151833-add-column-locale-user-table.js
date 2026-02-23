export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('users', 'locale', {
    type: Sequelize.STRING(20),
    allowNull: true,
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn('users', 'locale');
}
