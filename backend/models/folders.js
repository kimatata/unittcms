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
        model: 'folder',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'project',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
  });

  Folder.associate = (models) => {
    Folder.belongsTo(models.Project, { foreignKey: 'projectId', onDelete: 'CASCADE' });
    Folder.belongsTo(models.folder, { foreignKey: 'parentFolderId', onDelete: 'CASCADE' });
    Folder.hasMany(models.Case, { foreignKey: 'folderId' });
  };

  return Folder;
}

export default defineFolder;
