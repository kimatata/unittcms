export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('runs', 'pipelineRunId', {
    type: Sequelize.INTEGER,
    allowNull: true,
    references: {
      model: 'ci_pipeline_runs',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn('runs', 'pipelineRunId');
}
