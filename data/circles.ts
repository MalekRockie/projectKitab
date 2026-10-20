import { Message } from '../services/messages/messageMapping';

export type Room = { id: string; name: string; messages: Message[] };
export type Server = { id: string; name: string; initials: string; tint: string; rooms: Room[]; folderId?: string | null };

// Sample channel data remains local until circle channel endpoints are available.
export const SERVERS: Server[] = [
    {
        id: 'reading-room', name: 'The Reading Room', initials: 'RR', tint: '#2B776A',
        rooms: [
            { id: 'general', name: 'general', messages: [
                { id: 'r1', author: 'Mina', body: 'Finally finished The Left Hand of Darkness. I need a whole evening to think about that ending.', time: '9:18 AM' },
                { id: 'r2', author: 'You', body: 'That last chapter stays with you. What did you make of the journey across the ice?', time: '9:24 AM', own: true },
                { id: 'r3', author: 'Theo', body: 'Adding it to my weekend stack. No spoilers, but how slow is the start?', time: '9:31 AM' },
                { id: 'r4', author: 'Mina', body: 'A little patient, but the world-building earns every page.', time: '9:34 AM' },
            ] },
            { id: 'introductions', name: 'introductions', messages: [
                { id: 'r5', author: 'Mina', body: 'Welcome in! Tell us what you are reading this month.', time: 'Yesterday' },
            ] },
            { id: 'book-club', name: 'monthly-pick', messages: [
                { id: 'r6', author: 'Theo', body: 'Poll is up for next month’s pick.', time: 'Yesterday' },
            ] },
        ],
    },
    {
        id: 'makers', name: 'Weekend Makers', initials: 'WM', tint: '#C66A43',
        rooms: [
            { id: 'workshop', name: 'workshop', messages: [
                { id: 'm1', author: 'Ari', body: 'I got the tiny plant stand to hold its first pot. Sketches coming later today.', time: '10:02 AM' },
                { id: 'm2', author: 'You', body: 'That is a satisfying milestone. What wood did you end up using?', time: '10:11 AM', own: true },
            ] },
            { id: 'show-and-tell', name: 'show-and-tell', messages: [] },
            { id: 'resources', name: 'resources', messages: [] },
        ],
    },
    {
        id: 'field-notes', name: 'Field Notes', initials: 'FN', tint: '#758B3F',
        rooms: [
            { id: 'garden-chat', name: 'garden-chat', messages: [
                { id: 'g1', author: 'June', body: 'The first tomatoes are turning red. The balcony garden survived another heat wave.', time: '8:46 AM' },
            ] },
            { id: 'plant-help', name: 'plant-help', messages: [] },
        ],
    },
];

export const INITIAL_CHAT_STATE: Record<string, Message[]> = Object.fromEntries(
    SERVERS.flatMap(server => server.rooms).map(item => [item.id, item.messages]),
);
