export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('users', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    username: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    role: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    avatarPath: {
      type: Sequelize.STRING,
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
  await queryInterface.dropTable('users');
}
