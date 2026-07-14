export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('cases', 'externalId', {
    type: Sequelize.STRING,
    allowNull: true,
  });
  await queryInterface.addIndex('cases', ['externalId']);
}

export async function down(queryInterface) {
  await queryInterface.removeIndex('cases', ['externalId']);
  await queryInterface.sequelize.query('ALTER TABLE "cases" DROP COLUMN "externalId"');
}
