export async function up(queryInterface, DataTypes) {
  await queryInterface.addColumn('sprintConfigs', 'sourceBranch', {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: null,
  });
  await queryInterface.addColumn('sprintConfigs', 'deploymentFlow', {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: null,
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn('sprintConfigs', 'sourceBranch');
  await queryInterface.removeColumn('sprintConfigs', 'deploymentFlow');
}
