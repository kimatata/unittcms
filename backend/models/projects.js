function defineProject(sequelize, DataTypes) {
  const Project = sequelize.define("Project", {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    detail: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  });

  return Project;
}

module.exports = defineProject;
