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
    path: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });

  Attachment.associate = (models) => {
    Attachment.belongsToMany(models.Case, {
      through: 'caseAttachments',
    });
  };

  return Attachment;
}

module.exports = defineAttachment;
