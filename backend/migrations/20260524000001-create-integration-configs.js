export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('integrationConfigs', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    projectId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'projects', key: 'id' },
      onDelete: 'CASCADE',
    },
    service: {
      type: Sequelize.STRING(50),
      allowNull: false,
    },
    apiKey: {
      type: Sequelize.STRING,
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

  await queryInterface.addIndex('integrationConfigs', ['projectId', 'service'], { unique: true });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('integrationConfigs');
}
