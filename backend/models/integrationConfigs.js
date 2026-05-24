function defineIntegrationConfig(sequelize, DataTypes) {
  const IntegrationConfig = sequelize.define('IntegrationConfig', {
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Projects', key: 'id' },
      onDelete: 'CASCADE',
    },
    service: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    apiKey: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });

  IntegrationConfig.associate = (models) => {
    IntegrationConfig.belongsTo(models.Project, { foreignKey: 'projectId', onDelete: 'CASCADE' });
  };

  return IntegrationConfig;
}

export default defineIntegrationConfig;
