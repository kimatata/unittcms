function defineStep(sequelize, DataTypes) {
  const Step = sequelize.define('Step', {
    step: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    result: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  }, { tableName: 'steps' });

  Step.associate = (models) => {
    Step.belongsToMany(models.Case, {
      through: 'caseSteps',
      foreignKey: 'stepId',
      otherKey: 'caseId',
    });
  };

  return Step;
}

export default defineStep;
