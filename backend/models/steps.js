function defineStep(sequelize, DataTypes) {
  const Step = sequelize.define('Step', {
    step: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    result: {
      type: DataTypes.STRING,
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
