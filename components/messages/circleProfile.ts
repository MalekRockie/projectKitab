import { Message } from '../../services/messages/messageMapping';
import { getCircleColor } from './CircleRail';

export type CircleProfile = {
    name: string;
    username: string;
    initials: string;
    color: string;
    isOwn: boolean;
    joinedApp: Date;
    joinedCircle: Date;
};

const DAY = 24 * 60 * 60 * 1000;

const hash = (value: string) => Array.from(value).reduce((total, char) => (total * 31 + char.charCodeAt(0)) >>> 0, 7);

export const getInitials = (name: string) => name.split(/\s+/).map(part => part[0] ?? '').join('').slice(0, 2).toUpperCase() || '?';

// Placeholder until channels and members are served by the API.
export function buildPlaceholderProfile(message: Message, own: { displayName: string; username: string }): CircleProfile {
    const name = message.own ? own.displayName || own.username || 'You' : message.author;
    const seed = hash(name);
    const joinedApp = new Date(Date.now() - (200 + (seed % 900)) * DAY);
    return {
        name,
        username: message.own ? own.username || 'you' : name.toLowerCase().replace(/\s+/g, ''),
        initials: getInitials(name),
        color: getCircleColor(name),
        isOwn: Boolean(message.own),
        joinedApp,
        joinedCircle: new Date(joinedApp.getTime() + (10 + (seed % 120)) * DAY),
    };
}
