function defineCiRepositoryConfig(sequelize, DataTypes) {
  const CiRepositoryConfig = sequelize.define(
    'CiRepositoryConfig',
    {
      projectId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      provider: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      repoOwner: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      repoName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      accessToken: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      enabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    { tableName: 'ci_repository_configs' }
  );

  CiRepositoryConfig.associate = (models) => {
    CiRepositoryConfig.belongsTo(models.Project, { foreignKey: 'projectId', onDelete: 'CASCADE' });
    CiRepositoryConfig.hasMany(models.CiPipelineRun, { foreignKey: 'configId', onDelete: 'CASCADE' });
  };

  return CiRepositoryConfig;
}

export default defineCiRepositoryConfig;
