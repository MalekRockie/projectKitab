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

export type CircleChannelCategory = {
    id: string;
    name: string;
    display_order: number;
};

export type CircleChannel = {
    id: string;
    category_id: string | null;
    name: string;
    type: string;
    topic?: string | null;
    is_nsfw: boolean;
    slow_mode_seconds: number;
    display_order: number;
    created_at: string;
};

export type CircleChannelsResponse = {
    categories: CircleChannelCategory[];
    channels: CircleChannel[];
};

export type CircleChannelMessage = {
    id: string;
    channel_id: string;
    sender: {
        user_id: string;
        username: string;
        display_name?: string | null;
        nickname?: string | null;
        avatar_url?: string | null;
        is_member: boolean;
    };
    content: string;
    is_deleted: boolean;
    is_edited: boolean;
    is_pinned: boolean;
    created_at: string;
};

export type CircleChannelMessagesResponse = {
    messages: CircleChannelMessage[];
    has_more: boolean;
    next_before: string | null;
    next_before_id: string | null;
};

export type CircleChannelMessagesOptions = {
    limit?: number;
    before?: string;
    before_id?: string;
};

export type CircleDetails = {
    id: string;
    owner_id: string;
    name: string;
    icon_url: string | null;
    is_animated_icon: boolean;
    banner_url: string | null;
    member_count: number;
    is_owner: boolean;
};

// Owner-only. Send just the fields being changed.
export type CircleUpdate = Partial<Pick<CircleDetails, 'name' | 'icon_url' | 'is_animated_icon' | 'banner_url'>>;


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

export async function getCircleChannels(circleId: string): Promise<CircleChannelsResponse> {
    const response = await privateApi.get(`/api/p/v1/circles/${encodeURIComponent(circleId)}/channels`);
    if (!Array.isArray(response.data?.categories) || !Array.isArray(response.data?.channels)) {
        throw new Error('Invalid circle channels response');
    }
    return {
        categories: response.data.categories,
        channels: response.data.channels,
    };
}

export async function getCircleChannelMessages(
    circleId: string,
    channelId: string,
    { limit = 50, before, before_id }: CircleChannelMessagesOptions = {},
): Promise<CircleChannelMessagesResponse> {
    const response = await privateApi.get(
        `/api/p/v1/circles/${encodeURIComponent(circleId)}/channels/${encodeURIComponent(channelId)}/messages`,
        { params: { limit, ...(before ? { before } : {}), ...(before_id ? { before_id } : {}) } },
    );
    if (!Array.isArray(response.data?.messages)) {
        throw new Error('Invalid circle channel messages response');
    }
    if (response.data.has_more && (!response.data.next_before || !response.data.next_before_id)) {
        throw new Error('Circle channel history response is missing its pagination cursor');
    }
    return {
        messages: response.data.messages,
        has_more: Boolean(response.data.has_more),
        next_before: response.data.next_before ?? null,
        next_before_id: response.data.next_before_id ?? null,
    };
}

export async function getCircle(circleId: string): Promise<CircleDetails> {
    const response = await privateApi.get(`/api/p/v1/circles/${encodeURIComponent(circleId)}`);
    const circle = response.data?.circle ?? response.data;
    if (!circle || typeof circle.id !== 'string' || typeof circle.name !== 'string') {
        throw new Error('Invalid circle details response');
    }
    return {
        id: circle.id,
        owner_id: circle.owner_id,
        name: circle.name,
        icon_url: circle.icon_url ?? null,
        is_animated_icon: Boolean(circle.is_animated_icon),
        banner_url: circle.banner_url ?? null,
        member_count: Number(circle.member_count) || 0,
        is_owner: Boolean(circle.is_owner),
    };
}

export async function updateCircle(circleId: string, update: CircleUpdate): Promise<void> {
    await privateApi.patch(`/api/p/v1/circles/${encodeURIComponent(circleId)}`, update);
}

export type CircleMember = {
    user_id: string;
    username: string;
    display_name?: string | null;
    nickname?: string | null;
    joined_at: string;
    is_owner: boolean;
    role_ids: string[];
};

export type CircleMembersPage = {
    members: CircleMember[];
    page: number;
    limit: number;
};

export async function getCircleMembers(circleId: string, page = 1, limit = 50): Promise<CircleMembersPage> {
    const response = await privateApi.get(`/api/p/v1/circles/${encodeURIComponent(circleId)}/members`, { params: { page, limit } });
    const data = response.data ?? {};
    return {
        members: Array.isArray(data.members) ? data.members : [],
        page: Number(data.page) || page,
        limit: Number(data.limit) || limit,
    };
}

export type CircleMemberProfile = {
    user_id: string;
    name?: string | null;
    nickname?: string | null;
    username: string;
    display_name?: string | null;
    avatar_url?: string | null;
    bio?: string | null;
    joined_at: string;
    is_owner: boolean;
    roles: unknown[];
};

export async function getCircleMemberProfile(circleId: string, userId: string): Promise<CircleMemberProfile> {
    const response = await privateApi.get(`/api/p/v1/circles/${encodeURIComponent(circleId)}/members/${encodeURIComponent(userId)}`);
    return response.data.member;
}

// Pass '@me' as userId to change your own nickname.
export async function updateCircleMemberNickname(circleId: string, userId: string, nickname: string): Promise<void> {
    await privateApi.patch(`/api/p/v1/circles/${encodeURIComponent(circleId)}/members/${encodeURIComponent(userId)}`, { nickname });
}

export async function deleteCircle(circleId: string): Promise<void> {
    await privateApi.delete(`/api/p/v1/circles/${encodeURIComponent(circleId)}`);
}

// Bit flags for CircleRole.permissions, mirroring the backend constants.
export const CirclePermission = {
    ViewChannels: 1 << 0,
    SendMessages: 1 << 1,
    ReadHistory: 1 << 2,
    AttachFiles: 1 << 3,
    ManageMessages: 1 << 4,
    ManageNicknames: 1 << 5,
    KickMembers: 1 << 6,
    BanMembers: 1 << 7,
    ManageChannels: 1 << 8,
    ManageRoles: 1 << 9,
    ManageCircle: 1 << 10,
    CreateInvites: 1 << 11,
    Administrator: 1 << 30,
} as const;

export const DEFAULT_EVERYONE_PERMISSIONS =
    CirclePermission.ViewChannels | CirclePermission.SendMessages | CirclePermission.ReadHistory |
    CirclePermission.AttachFiles | CirclePermission.CreateInvites;

// Administrator implies every other permission.
export const hasCirclePermission = (permissions: number, permission: number) =>
    (permissions & CirclePermission.Administrator) !== 0 || (permissions & permission) === permission;

export type CircleRole = {
    id: string;
    name: string;
    color?: string | null;
    icon_url?: string | null;
    permissions: number;
    position: number;
    is_default: boolean;
    is_mentionable: boolean;
    created_at: string;
};

export type CircleRoleInput = {
    name: string;
    color?: string;
    icon_url?: string;
    permissions?: number;
    is_mentionable?: boolean;
};

// Admin-only for now.
export async function getCircleRoles(circleId: string): Promise<CircleRole[]> {
    const response = await privateApi.get(`/api/p/v1/circles/${encodeURIComponent(circleId)}/roles`);
    return Array.isArray(response.data?.roles) ? response.data.roles : [];
}

// Admin-only for now.
export async function createCircleRole(circleId: string, role: CircleRoleInput): Promise<void> {
    await privateApi.post(`/api/p/v1/circles/${encodeURIComponent(circleId)}/roles`, role);
}

export async function leaveCircle(circleId: string): Promise<void> {
    await privateApi.delete(`/api/p/v1/circles/${encodeURIComponent(circleId)}/members/@me`);
}

// Owner-only.
export async function kickCircleMember(circleId: string, userId: string): Promise<void> {
    await privateApi.delete(`/api/p/v1/circles/${encodeURIComponent(circleId)}/members/${encodeURIComponent(userId)}`);
}

export type CircleBan = {
    user_id: string;
    username: string;
    display_name?: string | null;
    reason?: string | null;
    banned_at?: string;
    banned_by?: string;
};

export type CircleBansPage = {
    bans: CircleBan[];
    page: number;
    limit: number;
};

export async function getCircleBans(circleId: string, page = 1, limit = 50): Promise<CircleBansPage> {
    const response = await privateApi.get(`/api/p/v1/circles/${encodeURIComponent(circleId)}/bans`, { params: { page, limit } });
    const data = response.data ?? {};
    return {
        bans: Array.isArray(data.bans) ? data.bans : [],
        page: Number(data.page) || page,
        limit: Number(data.limit) || limit,
    };
}

export async function banCircleMember(circleId: string, userId: string, reason: string): Promise<void> {
    await privateApi.put(`/api/p/v1/circles/${encodeURIComponent(circleId)}/bans/${encodeURIComponent(userId)}`, { reason });
}

export async function unbanCircleMember(circleId: string, userId: string): Promise<void> {
    await privateApi.delete(`/api/p/v1/circles/${encodeURIComponent(circleId)}/bans/${encodeURIComponent(userId)}`);
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
