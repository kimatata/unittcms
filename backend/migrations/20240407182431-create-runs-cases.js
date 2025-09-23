export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('runCases', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    runId: {
      type: Sequelize.INTEGER,
      references: {
        model: 'runs',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
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
    status: {
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

  await queryInterface.addIndex('runCases', ['runId', 'caseId'], {
    unique: true,
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('runCases');
}
