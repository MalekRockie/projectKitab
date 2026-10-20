import { privateApi } from '../base';

export type Circle = {
    id: string;
    owner_id: string;
    name: string;
    is_animated_icon: boolean;
    joined_at: string;
    display_order: number;
    folder_id: string | null;
};

export type CircleFolder = {
    id: string;
    name: string;
    display_order: number;
    created_at: string;
};

export type CircleLayoutItem =
    | { type: 'circle'; id: string }
    | { type: 'folder'; id: string; circle_ids: string[] };

export function buildCircleLayout(circles: Circle[], folders: CircleFolder[]): CircleLayoutItem[] {
    const folderIds = new Set(folders.map(folder => folder.id));
    const entries: Array<{ order: number; index: number; item: CircleLayoutItem }> = [];

    circles.filter(circle => !circle.folder_id || !folderIds.has(circle.folder_id)).forEach((circle, index) => {
        entries.push({ order: circle.display_order, index, item: { type: 'circle', id: circle.id } });
    });
    folders.forEach((folder, index) => {
        entries.push({
            order: folder.display_order,
            index: circles.length + index,
            item: {
                type: 'folder',
                id: folder.id,
                circle_ids: circles.filter(circle => circle.folder_id === folder.id)
                    .sort((a, b) => a.display_order - b.display_order)
                    .map(circle => circle.id),
            },
        });
    });

    return entries.sort((a, b) => a.order - b.order || a.index - b.index).map(entry => entry.item);
}

export async function getCircles(): Promise<Circle[]> {
    const response = await privateApi.get('/api/p/v1/circles');
    if (!Array.isArray(response.data?.circles)) {throw new Error('Invalid circles response');}
    return response.data.circles;
}

export async function createCircle(name: string): Promise<void> {
    await privateApi.post('/api/p/v1/circles', { name });
}

export async function updateCircleOrder(layout: CircleLayoutItem[]): Promise<void> {
    await privateApi.put('/api/p/v1/circles/order', { layout });
}

export async function getCircleFolders(): Promise<CircleFolder[]> {
    const response = await privateApi.get('/api/p/v1/circles/folders');
    if (!Array.isArray(response.data?.folders)) {throw new Error('Invalid circle folders response');}
    return response.data.folders;
}

export async function createCircleFolder(name: string): Promise<CircleFolder> {
    const response = await privateApi.post('/api/p/v1/circles/folders', { name });
    const folder = response.data?.folder ?? response.data;
    if (
        !folder
        || typeof folder.id !== 'string'
        || typeof folder.name !== 'string'
        || typeof folder.display_order !== 'number'
        || typeof folder.created_at !== 'string'
    ) {
        throw new Error('Invalid created circle folder response');
    }
    return {
        id: folder.id,
        name: folder.name,
        display_order: folder.display_order,
        created_at: folder.created_at,
    };
}

export async function renameCircleFolder(folderId: string, name: string): Promise<void> {
    await privateApi.patch(`/api/p/v1/circles/folders/${encodeURIComponent(folderId)}`, { name });
}

export async function deleteCircleFolder(folderId: string): Promise<void> {
    await privateApi.delete(`/api/p/v1/circles/folders/${encodeURIComponent(folderId)}`);
}

export async function moveCircleToFolder(circleId: string, folderId: string | null): Promise<void> {
    await privateApi.put(`/api/p/v1/circles/${encodeURIComponent(circleId)}/folder`, {
        folder_id: folderId,
    });
}
