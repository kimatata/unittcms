export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('IntegrationConfigs', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    projectId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'Projects', key: 'id' },
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

  await queryInterface.addIndex('IntegrationConfigs', ['projectId', 'service'], { unique: true });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('IntegrationConfigs');
}
