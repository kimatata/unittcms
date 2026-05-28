export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('automationConfigs', {
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
    gitlabUrl: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'https://gitlab.com',
    },
    gitlabToken: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    gitlabNamespace: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    repoName: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    repoUrl: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    repoId: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    automationTool: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'playwright',
    },
    automationLanguage: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'typescript',
    },
    provider: {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: 'gitlab',
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
  await queryInterface.dropTable('automationConfigs');
}
