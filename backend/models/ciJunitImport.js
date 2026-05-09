function defineCiJunitImport(sequelize, DataTypes) {
  const CiJunitImport = sequelize.define(
    'CiJunitImport',
    {
      runId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      projectId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      source: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      pipelineJobId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      matched: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      created: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      skipped: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      total: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    },
    { tableName: 'ci_junit_imports' }
  );

  return CiJunitImport;
}

export default defineCiJunitImport;
