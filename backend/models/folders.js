function defineFolder(sequelize, DataTypes) {
  const Folder = sequelize.define('Folder', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    detail: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    parentFolderId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'folders',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'projects',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
  }, { tableName: 'folders' });

  Folder.associate = (models) => {
    Folder.belongsTo(models.Project, { foreignKey: 'projectId', onDelete: 'CASCADE' });
    Folder.belongsTo(models.Folder, { foreignKey: 'parentFolderId', onDelete: 'CASCADE', as: 'parentFolder' });
    Folder.hasMany(models.Case, { foreignKey: 'folderId' });
  };

  return Folder;
}

export default defineFolder;
