export async function up(queryInterface) {
  // Rename column 'path' to 'filename' in 'attachments' table
  await queryInterface.renameColumn('attachments', 'path', 'filename');
}

export async function down(queryInterface) {
  // Revert column name from 'filename' back to 'path'
  await queryInterface.renameColumn('attachments', 'filename', 'path');
}
