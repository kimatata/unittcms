export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('sprintConfigs', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    automationConfigId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      unique: true,
      references: { model: 'automationConfigs', key: 'id' },
      onDelete: 'CASCADE',
    },
    keyBranchPatterns: {
      type: Sequelize.TEXT,
      allowNull: false,
      defaultValue: '["main","master","develop"]',
    },
    sprintBranchPattern: {
      type: Sequelize.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
    jiraBaseUrl: {
      type: Sequelize.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    jiraProjectKey: {
      type: Sequelize.STRING(50),
      allowNull: true,
      defaultValue: null,
    },
    branchTicketRegex: {
      type: Sequelize.STRING(255),
      allowNull: true,
      defaultValue: '([A-Z]+-[0-9]+)',
    },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('sprintConfigs');
}
