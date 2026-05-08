function defineCiPipelineRun(sequelize, DataTypes) {
  const CiPipelineRun = sequelize.define(
    'CiPipelineRun',
    {
      configId: {
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
      branch: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      commitSha: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      triggeredBy: {
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
    { tableName: 'ci_pipeline_runs' }
  );

  CiPipelineRun.associate = (models) => {
    CiPipelineRun.belongsTo(models.CiRepositoryConfig, { foreignKey: 'configId', onDelete: 'CASCADE' });
    CiPipelineRun.hasMany(models.CiPipelineJob, { foreignKey: 'pipelineRunId', onDelete: 'CASCADE' });
  };

  return CiPipelineRun;
}

export default defineCiPipelineRun;
