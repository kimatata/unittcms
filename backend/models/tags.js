function defineTag(sequelize, DataTypes) {
  const Tags = sequelize.define('Tags', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
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
  });

  Tags.associate = (models) => {
    Tags.belongsTo(models.Project, {
      foreignKey: 'projectId',
      onDelete: 'CASCADE',
    });

    Tags.belongsToMany(models.Case, {
      through: 'caseTags',
      foreignKey: 'tagId',
      otherKey: 'caseId',
    });
  };

  return Tags;
}

export default defineTag;
