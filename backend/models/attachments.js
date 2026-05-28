function defineAttachment(sequelize, DataTypes) {
  const Attachment = sequelize.define('Attachment', {
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    detail: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    filename: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, { tableName: 'attachments' });

  Attachment.associate = (models) => {
    Attachment.belongsToMany(models.Case, { through: models.CaseAttachment, foreignKey: 'attachmentId', otherKey: 'caseId' });
  };

  return Attachment;
}

export default defineAttachment;
