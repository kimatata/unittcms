'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('Projects', [
      {
        name: 'Project 1',
        detail: 'Details of Project 1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Project 2',
        detail: 'Details of Project 2',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Project 3',
        detail: 'Details of Project 3',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    // do nothing
  },
};
