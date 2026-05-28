export async function up(queryInterface) {
  // Rename column 'path' to 'filename' in 'Attachments' table
  await queryInterface.renameColumn('attachments', 'path', 'filename');
}

export async function down(queryInterface) {
  // Revert column name from 'filename' back to 'path'
  await queryInterface.renameColumn('attachments', 'filename', 'path');
}
