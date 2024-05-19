function defineProject(sequelize, DataTypes) {
  const Project = sequelize.define('Project', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    detail: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  });

  Project.associate = (models) => {
    Project.hasMany(models.Folder, { foreignKey: 'projectId' });
  };

  return Project;
}

module.exports = defineProject;
