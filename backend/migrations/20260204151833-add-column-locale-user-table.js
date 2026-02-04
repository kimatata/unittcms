export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('users', 'locale', {
    type: Sequelize.STRING,
    allowNull: true,
    length: 20,
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn('users', 'locale');
}
