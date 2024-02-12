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
    },
  });

  return Run;
}

module.exports = defineRun;