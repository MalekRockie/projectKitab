import { useCallback, useState } from 'react';

// Tracks fullscreen gallery state for a fixed list of media blocks. Only
// pass the owning post's own media — a block id that isn't in the list
// falls back to index 0.
export default function useGalleryViewer(mediaBlocks) {
    const [visible, setVisible] = useState(false);
    const [initialIndex, setInitialIndex] = useState(0);

    const open = useCallback((blockId) => {
        const index = mediaBlocks.findIndex(b => b.id === blockId);
        setInitialIndex(index >= 0 ? index : 0);
        setVisible(true);
    }, [mediaBlocks]);

    const close = useCallback(() => setVisible(false), []);

    return { visible, initialIndex, open, close };
}
