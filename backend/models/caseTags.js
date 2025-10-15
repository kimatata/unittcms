function definecaseTags(sequelize, DataTypes) {
  const caseTags = sequelize.define('caseTags', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    caseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'cases',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    tagId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tags',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
  });

  caseTags.associate = (models) => {
    caseTags.belongsTo(models.Case, { foreignKey: 'caseId', onDelete: 'CASCADE' });
    caseTags.belongsTo(models.Tags, { foreignKey: 'tagId', onDelete: 'CASCADE' });
  };

  return caseTags;
}

export default definecaseTags;
