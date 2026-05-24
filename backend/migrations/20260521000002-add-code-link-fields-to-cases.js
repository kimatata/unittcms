export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('cases', 'codeStatus', {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: 'none',
  });
  await queryInterface.addColumn('cases', 'codeFilePath', {
    type: Sequelize.STRING,
    allowNull: true,
  });
  await queryInterface.addColumn('cases', 'codeLastSyncAt', {
    type: Sequelize.DATE,
    allowNull: true,
  });
  await queryInterface.addColumn('cases', 'codeCommitSha', {
    type: Sequelize.STRING,
    allowNull: true,
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn('cases', 'codeStatus');
  await queryInterface.removeColumn('cases', 'codeFilePath');
  await queryInterface.removeColumn('cases', 'codeLastSyncAt');
  await queryInterface.removeColumn('cases', 'codeCommitSha');
}
