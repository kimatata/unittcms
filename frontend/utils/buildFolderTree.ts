import { FolderType, TreeNodeData } from '@/types/folder';

export function buildFolderTree(folders: FolderType[]): TreeNodeData[] {
  const folderMap = new Map<number, TreeNodeData>();

  folders.forEach((folder) => {
    folderMap.set(folder.id, {
      id: folder.id.toString(),
      name: folder.name,
      detail: folder.detail,
      parentFolderId: folder.parentFolderId,
      projectId: folder.projectId,
      folderData: folder,
      children: [],
    });
  });

  const tree: TreeNodeData[] = [];

  folders.forEach((folder) => {
    const currentNode = folderMap.get(folder.id);

    if (!currentNode) return;

    if (folder.parentFolderId === null) {
      tree.push(currentNode);
    } else {
      const parent = folderMap.get(folder.parentFolderId);
      if (parent && parent.children) {
        parent.children.push(currentNode);
      }
    }
  });

  return tree;
}
