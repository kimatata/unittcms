'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add projects table records
    await queryInterface.bulkInsert('Projects', [
      {
        name: 'Project 1',
        detail: 'Details of Project 1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Project 2',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Project 3',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // Add folders table records
    await queryInterface.bulkInsert('folders', [
      {
        name: 'Folder 1',
        detail: 'Details of Folder 1',
        projectId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Folder 2',
        projectId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Folder 3',
        projectId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    // do nothingg
  },
};
