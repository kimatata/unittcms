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
    assigneeUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
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
    RunCase.hasMany(models.Comment, {
      foreignKey: 'commentableId',
      onDelete: 'CASCADE',
    });
    RunCase.belongsTo(models.User, {
      as: 'assignee',
      foreignKey: 'assigneeUserId',
      onDelete: 'SET NULL',
    });
  };

  return RunCase;
}

export default defineRunCase;
