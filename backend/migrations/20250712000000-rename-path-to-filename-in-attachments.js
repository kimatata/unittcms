'use strict';

module.exports = {
  up: async (queryInterface) => {
    // Rename column 'path' to 'filename' in 'Attachments' table
    await queryInterface.renameColumn('Attachments', 'path', 'filename');
  },

  down: async (queryInterface) => {
    // Revert column name from 'filename' back to 'path'
    await queryInterface.renameColumn('Attachments', 'filename', 'path');
  },
};
