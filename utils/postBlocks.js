// Blocks arrive with either camelCase or snake_case keys depending on the
// source (API vs. local store), so every consumer should read the type here.
export const getBlockType = (block) => block.blockType || block.block_type;

export const isMediaBlock = (block) => {
    const type = getBlockType(block);
    return type === 'image' || type === 'video';
};

export const getMediaBlocks = (blocks) => blocks?.filter(isMediaBlock) ?? [];

export const getTextBlocks = (blocks) => blocks?.filter(b => getBlockType(b) === 'text') ?? [];
