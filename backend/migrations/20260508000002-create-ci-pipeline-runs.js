export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('ci_pipeline_runs', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    configId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'ci_repository_configs',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    externalId: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    status: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    conclusion: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    providerStatus: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    providerConclusion: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    branch: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    commitSha: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    triggeredBy: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    startedAt: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    completedAt: {
      type: Sequelize.DATE,
      allowNull: true,
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

  await queryInterface.addIndex('ci_pipeline_runs', ['configId', 'externalId'], {
    name: 'idx_pipeline_runs_config_external',
    unique: true,
  });

  await queryInterface.addIndex('ci_pipeline_runs', ['configId', 'startedAt'], {
    name: 'idx_pipeline_runs_config_started',
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('ci_pipeline_runs');
}
