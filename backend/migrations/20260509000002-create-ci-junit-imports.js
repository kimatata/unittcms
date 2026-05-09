export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('ci_junit_imports', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    runId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'runs',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
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
    source: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    pipelineJobId: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'ci_pipeline_jobs',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    matched: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    skipped: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    total: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
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

  await queryInterface.addIndex('ci_junit_imports', ['projectId'], {
    name: 'idx_junit_imports_project',
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('ci_junit_imports');
}
