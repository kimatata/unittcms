'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.addConstraint('folders', {
      fields: ['parentFolderId'],
      type: 'foreign key',
      name: 'fk_folders_parentFolderId',
      references: {
        table: 'folders',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeConstraint('folders', 'fk_folders_parentFolderId');
  },
};
