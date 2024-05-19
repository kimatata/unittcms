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
  });

  Step.associate = (models) => {
    Step.belongsToMany(models.Case, {
      through: 'caseSteps',
    });
  };

  return Step;
}

module.exports = defineStep;
