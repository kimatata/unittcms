export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('runCaseAttachments', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    runCaseId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'runCases',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    attachmentId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'attachments',
        key: 'id',
      },
      onUpdate: 'CASCADE',
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

  await queryInterface.addIndex('runCaseAttachments', ['runCaseId', 'attachmentId'], {
    unique: true,
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('runCaseAttachments');
}
