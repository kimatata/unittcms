function defineCaseAttachment(sequelize, DataTypes) {
  const CaseAttachment = sequelize.define('CaseAttachment', {
    caseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    attachmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  });

  CaseAttachment.associate = (models) => {
    CaseAttachment.belongsTo(models.Case, {
      foreignKey: 'caseId',
      onDelete: 'CASCADE',
    });
    CaseAttachment.belongsTo(models.Attachment, {
      foreignKey: 'attachmentId',
      onDelete: 'CASCADE',
    });
  };

  return CaseAttachment;
}

module.exports = defineCaseAttachment;
