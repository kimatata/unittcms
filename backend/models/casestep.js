function defineCaseStep(sequelize, DataTypes) {
  const CaseStep = sequelize.define("CaseStep", {
    caseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    stepId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  });

  return CaseStep;
}

module.exports = defineCaseStep;