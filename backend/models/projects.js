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
    isPublic: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'user',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
  });

  Project.associate = (models) => {
    Project.hasMany(models.Folder, { foreignKey: 'projectId' });
  };

  return Project;
}

module.exports = defineProject;
