import { privateApi } from '../base';

export type BookmarkedComment = {
  id: string;
  post_id: string;
  created_at: string;
  blocks?: Array<{ content?: string; block_type?: string }>;
  user?: { username?: string };
};

export type BookmarkItem = {
  id: string;
  target_type: 'post' | 'comment';
  target_id: string;
  bookmarked_at: string;
  // Feed-shaped post, same as /feed responses.
  post?: Record<string, any>;
  comment?: BookmarkedComment;
};

export type BookmarkFolder = {
  id: string;
  name: string;
};

export async function getBookmarks(options: { page?: number; limit?: number; folderId?: string } = {}): Promise<BookmarkItem[]> {
  const { page = 1, limit = 20, folderId } = options;
  const params: Record<string, string | number> = { page, limit };
  if (folderId) {
    params.folder_id = folderId;
  }
  const response = await privateApi.get('/api/p/v1/bookmarks', { params });
  return response.data?.bookmarks ?? [];
}

export async function deleteBookmark(targetId: string): Promise<void> {
  await privateApi.delete(`/api/p/v1/bookmarks/${targetId}`);
}

export async function getBookmarkFolders(): Promise<BookmarkFolder[]> {
  const response = await privateApi.get('/api/p/v1/bookmark-folders');
  return response.data?.folders ?? [];
}
