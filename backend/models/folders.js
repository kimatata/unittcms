function defineFolder(sequelize, DataTypes) {
  const Folder = sequelize.define("Folder", {
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
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  });

  return Folder;
}

module.exports = defineFolder;
