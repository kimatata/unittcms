export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('ci_junit_imports', 'created', {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0,
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn('ci_junit_imports', 'created');
}
