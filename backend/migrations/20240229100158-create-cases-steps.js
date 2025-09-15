export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('caseSteps', {
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
    stepId: {
      type: Sequelize.INTEGER,
      references: {
        model: 'steps',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    stepNo: {
      type: Sequelize.INTEGER,
      allowNull: false,
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

  await queryInterface.addIndex('caseSteps', ['caseId', 'stepId'], {
    unique: true,
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('caseSteps');
}
