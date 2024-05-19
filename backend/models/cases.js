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
        model: 'folder',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
  });

  Case.associate = (models) => {
    Case.belongsTo(models.Folder, {
      foreignKey: 'folderId',
      onDelete: 'CASCADE',
    });
    Case.belongsToMany(models.Step, {
      through: 'caseSteps',
    });
  };

  return Case;
}

module.exports = defineCase;
