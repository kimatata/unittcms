function defineComment(sequelize, DataTypes) {
  const Comment = sequelize.define('Comment', {
    commentableType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    commentableId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  }, { tableName: 'comments' });

  Comment.associate = (models) => {
    // Polymorphic associations
    Comment.belongsTo(models.RunCase, {
      foreignKey: 'commentableId',
      constraints: false,
      as: 'runCase',
    });
    Comment.belongsTo(models.Run, {
      foreignKey: 'commentableId',
      constraints: false,
      as: 'run',
    });
    Comment.belongsTo(models.Case, {
      foreignKey: 'commentableId',
      constraints: false,
      as: 'case',
    });
    Comment.belongsTo(models.User, {
      foreignKey: 'userId',
      onDelete: 'SET NULL',
    });
  };

  return Comment;
}

export default defineComment;
