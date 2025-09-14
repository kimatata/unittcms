export async function up(queryInterface) {
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
}

export async function down(queryInterface) {
  await queryInterface.removeConstraint('folders', 'fk_folders_parentFolderId');
}
