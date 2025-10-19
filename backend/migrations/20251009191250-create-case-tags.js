export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('caseTags', {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    caseId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'cases',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    tagId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'tags',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false,
    },
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('caseTags');
}
