function defineCiPipelineJob(sequelize, DataTypes) {
  const CiPipelineJob = sequelize.define(
    'CiPipelineJob',
    {
      pipelineRunId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      externalId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      conclusion: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      providerStatus: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      providerConclusion: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      startedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      completedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    { tableName: 'ci_pipeline_jobs' }
  );

  CiPipelineJob.associate = (models) => {
    CiPipelineJob.belongsTo(models.CiPipelineRun, { foreignKey: 'pipelineRunId', onDelete: 'CASCADE' });
  };

  return CiPipelineJob;
}

export default defineCiPipelineJob;
