export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('users', 'locale', {
    type: Sequelize.STRING(20),
    allowNull: true,
  });
}

export async function down(queryInterface) {
  await queryInterface.sequelize.query('ALTER TABLE "users" DROP COLUMN "locale"');
}
