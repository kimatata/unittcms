export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('ci_repository_configs', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    projectId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'projects',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    provider: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    repoOwner: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    repoName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    accessToken: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    enabled: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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
  await queryInterface.dropTable('ci_repository_configs');
}
