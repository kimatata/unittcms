function defineCase(sequelize, DataTypes) {
  const Case = sequelize.define('Case', {
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    state: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    priority: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    type: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    automationStatus: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    codeStatus: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'none',
    },
    codeFilePath: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    codeLastSyncAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    codeCommitSha: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    template: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    preConditions: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    expectedResults: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    folderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'folders',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
  }, { tableName: 'cases' });

  Case.associate = (models) => {
    Case.belongsTo(models.Folder, { foreignKey: 'folderId', onDelete: 'CASCADE' });
    Case.hasMany(models.RunCase, { foreignKey: 'caseId' });
    Case.belongsToMany(models.Step, { through: models.CaseStep, foreignKey: 'caseId', otherKey: 'stepId' });
    Case.belongsToMany(models.Tags, { through: models.caseTags, foreignKey: 'caseId', otherKey: 'tagId' });
    Case.belongsToMany(models.Attachment, { through: models.CaseAttachment, foreignKey: 'caseId', otherKey: 'attachmentId' });
  };

  return Case;
}

export default defineCase;
