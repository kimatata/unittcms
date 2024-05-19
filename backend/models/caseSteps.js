function defineCaseStep(sequelize, DataTypes) {
  const CaseStep = sequelize.define('CaseStep', {
    caseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    stepId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    stepNo: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  });

  CaseStep.associate = (models) => {
    CaseStep.belongsTo(models.Case, {
      foreignKey: 'caseId',
      onDelete: 'CASCADE',
    });
    CaseStep.belongsTo(models.Step, {
      foreignKey: 'stepId',
      onDelete: 'CASCADE',
    });
  };

  return CaseStep;
}

module.exports = defineCaseStep;
