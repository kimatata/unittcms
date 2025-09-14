export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('caseAttachments', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    caseId: {
      type: Sequelize.INTEGER,
      references: {
        model: 'cases',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    attachmentId: {
      type: Sequelize.INTEGER,
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

  await queryInterface.addIndex('caseAttachments', ['caseId', 'attachmentId'], {
    unique: true,
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('caseAttachments');
}
