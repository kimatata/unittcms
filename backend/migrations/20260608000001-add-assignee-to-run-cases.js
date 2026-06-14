export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('runCases', 'assigneeUserId', {
    type: Sequelize.INTEGER,
    allowNull: true,
    defaultValue: null,
    references: {
      model: 'users',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });

  await queryInterface.addIndex('runCases', ['runId', 'assigneeUserId'], {
    name: 'runCases_runId_assigneeUserId',
  });
}

export async function down(queryInterface) {
  await queryInterface.removeIndex('runCases', 'runCases_runId_assigneeUserId');
  await queryInterface.removeColumn('runCases', 'assigneeUserId');
}
