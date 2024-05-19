function defineRun(sequelize, DataTypes) {
  const Run = sequelize.define('Run', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    configurations: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    state: {
      type: DataTypes.INTEGER,
      allowNull: true,
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

  Run.associate = (models) => {
    Run.belongsTo(models.Project, { foreignKey: 'projectId', onDelete: 'CASCADE' });
  };

  return Run;
}

module.exports = defineRun;
