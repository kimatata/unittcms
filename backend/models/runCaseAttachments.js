function defineRunCaseAttachment(sequelize, DataTypes) {
  const RunCaseAttachment = sequelize.define('RunCaseAttachment', {
    runCaseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    attachmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  });

  RunCaseAttachment.associate = (models) => {
    RunCaseAttachment.belongsTo(models.RunCase, {
      foreignKey: 'runCaseId',
      onDelete: 'CASCADE',
    });
    RunCaseAttachment.belongsTo(models.Attachment, {
      foreignKey: 'attachmentId',
      onDelete: 'CASCADE',
    });
  };

  return RunCaseAttachment;
}

export default defineRunCaseAttachment;
