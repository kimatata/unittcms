/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { describe, it, expect } from 'vitest';
import { buildFolderTree } from './buildFolderTree';
import type { FolderType } from '@/types/folder';

describe('buildFolderTree', () => {
  it('should return an empty array when input is empty', () => {
    expect(buildFolderTree([])).toEqual([]);
  });

  it('should build a single root node', () => {
    const folders: FolderType[] = [
      { id: 1, name: 'root', detail: '', projectId: 1, parentFolderId: null, createdAt: '', updatedAt: '', Cases: [] },
    ];
    const tree = buildFolderTree(folders);
    expect(tree.length).toBe(1);
    expect(tree[0].id).toBe('1');
    expect(tree[0].children).toEqual([]);
  });

  it('should build a tree with parent and child', () => {
    const folders: FolderType[] = [
      { id: 1, name: 'root', detail: '', projectId: 1, parentFolderId: null, createdAt: '', updatedAt: '', Cases: [] },
      { id: 2, name: 'child', detail: '', projectId: 1, parentFolderId: 1, createdAt: '', updatedAt: '', Cases: [] },
    ];
    const tree = buildFolderTree(folders);
    expect(tree.length).toBe(1);
    expect(tree[0].id).toBe('1');
    expect(tree[0]!.children!.length).toBe(1);
    expect(tree[0]!.children![0].id).toBe('2');
  });

  it('should build a tree with multiple levels', () => {
    const folders: FolderType[] = [
      { id: 1, name: 'root', detail: '', projectId: 1, parentFolderId: null, createdAt: '', updatedAt: '', Cases: [] },
      { id: 2, name: 'child', detail: '', projectId: 1, parentFolderId: 1, createdAt: '', updatedAt: '', Cases: [] },
      {
        id: 3,
        name: 'grandchild',
        detail: '',
        projectId: 1,
        parentFolderId: 2,
        createdAt: '',
        updatedAt: '',
        Cases: [],
      },
    ];
    const tree = buildFolderTree(folders);
    expect(tree.length).toBe(1);
    expect(tree![0].children![0].children![0].id).toBe('3');
  });

  it('should build a forest if multiple roots', () => {
    const folders: FolderType[] = [
      { id: 1, name: 'root1', detail: '', projectId: 1, parentFolderId: null, createdAt: '', updatedAt: '', Cases: [] },
      { id: 2, name: 'root2', detail: '', projectId: 1, parentFolderId: null, createdAt: '', updatedAt: '', Cases: [] },
    ];
    const tree = buildFolderTree(folders);
    expect(tree.length).toBe(2);
    expect(tree.map((n) => n.id)).toContain('1');
    expect(tree.map((n) => n.id)).toContain('2');
  });
});
