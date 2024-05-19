function defineRunCase(sequelize, DataTypes) {
  const RunCase = sequelize.define('RunCase', {
    runId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    caseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  });

  RunCase.associate = (models) => {
    RunCase.belongsTo(models.Run, {
      foreignKey: 'runId',
      onDelete: 'CASCADE',
    });
    RunCase.belongsTo(models.Case, {
      foreignKey: 'caseId',
      onDelete: 'CASCADE',
    });
  };

  return RunCase;
}

module.exports = defineRunCase;
