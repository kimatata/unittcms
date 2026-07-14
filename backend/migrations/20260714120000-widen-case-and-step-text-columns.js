// cases.description/preConditions/expectedResults and steps.step/result hold
// free-form prose (test descriptions, step instructions, expected results)
// that regularly exceeds VARCHAR(255) — SQLite never enforces the length
// limit, so this went unnoticed there; Postgres does, and rejects real
// import data with "value too long for type character varying(255)".
export async function up(queryInterface, Sequelize) {
  await queryInterface.changeColumn('cases', 'description', {
    type: Sequelize.TEXT,
    allowNull: true,
  });
  await queryInterface.changeColumn('cases', 'preConditions', {
    type: Sequelize.TEXT,
    allowNull: true,
  });
  await queryInterface.changeColumn('cases', 'expectedResults', {
    type: Sequelize.TEXT,
    allowNull: true,
  });
  await queryInterface.changeColumn('steps', 'step', {
    type: Sequelize.TEXT,
    allowNull: false,
  });
  await queryInterface.changeColumn('steps', 'result', {
    type: Sequelize.TEXT,
    allowNull: false,
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.changeColumn('cases', 'description', {
    type: Sequelize.STRING,
    allowNull: true,
  });
  await queryInterface.changeColumn('cases', 'preConditions', {
    type: Sequelize.STRING,
    allowNull: true,
  });
  await queryInterface.changeColumn('cases', 'expectedResults', {
    type: Sequelize.STRING,
    allowNull: true,
  });
  await queryInterface.changeColumn('steps', 'step', {
    type: Sequelize.STRING,
    allowNull: false,
  });
  await queryInterface.changeColumn('steps', 'result', {
    type: Sequelize.STRING,
    allowNull: false,
  });
}
