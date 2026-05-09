export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('ciPipelineJobs', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    pipelineRunId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'ciPipelineRuns',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    externalId: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    status: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    conclusion: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    providerStatus: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    providerConclusion: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    startedAt: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    completedAt: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false,
    },
  });

  await queryInterface.addIndex('ciPipelineJobs', ['pipelineRunId', 'externalId'], {
    name: 'idx_pipeline_jobs_run_external',
    unique: true,
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('ciPipelineJobs');
}
