export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('runs', 'pipelineRunId', {
    type: Sequelize.INTEGER,
    allowNull: true,
    references: {
      model: 'ciPipelineRuns',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn('runs', 'pipelineRunId');
}
