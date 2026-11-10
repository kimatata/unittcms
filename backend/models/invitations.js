// An open seat on a project: whoever holds the link takes it, once.
function defineInvitation(sequelize, DataTypes) {
  const Invitation = sequelize.define('Invitation', {
    // The secret itself. There is no mail server here, so the link travels by
    // whatever channel the manager already uses — it has to be unguessable,
    // short-lived and revocable.
    token: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'projects',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    // Index into memberRoles of frontend/config/selection.ts. Carried by the
    // invitation so joining is one gesture, not two.
    role: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    // Who it was meant for, when the manager said so. A note and a way to
    // prefill the message — never a proof of identity.
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    createdById: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    acceptedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  Invitation.associate = (models) => {
    Invitation.belongsTo(models.Project, { foreignKey: 'projectId', onDelete: 'CASCADE' });
    Invitation.belongsTo(models.User, { foreignKey: 'createdById', onDelete: 'CASCADE' });
  };

  return Invitation;
}

export default defineInvitation;
