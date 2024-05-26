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
    Project.belongsTo(models.User, { foreignKey: 'userId', onDelete: 'CASCADE' });
    Project.hasMany(models.Folder, { foreignKey: 'projectId', onDelete: 'CASCADE' });
    Project.hasMany(models.Run, { foreignKey: 'projectId', onDelete: 'CASCADE' });
  };

  return Project;
}

module.exports = defineProject;
