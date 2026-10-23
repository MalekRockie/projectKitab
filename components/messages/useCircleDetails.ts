import { useCallback, useEffect, useState } from 'react';
import { CircleDetails, CircleUpdate, getCircle, updateCircle } from '../../services/api/messages/circles';

// Loads details for the opened circle (cached per circle) and saves owner edits.
export default function useCircleDetails(circleId: string) {
    const [detailsById, setDetailsById] = useState<Record<string, CircleDetails>>({});

    useEffect(() => {
        if (!circleId) {
            return;
        }
        let isCurrent = true;
        getCircle(circleId)
            .then(details => {
                if (isCurrent) {
                    setDetailsById(previous => ({ ...previous, [circleId]: details }));
                }
            })
            .catch(error => console.warn('Could not load circle details', error));
        return () => { isCurrent = false; };
    }, [circleId]);

    const save = useCallback(async (id: string, update: CircleUpdate) => {
        await updateCircle(id, update);
        const details = await getCircle(id);
        setDetailsById(previous => ({ ...previous, [id]: details }));
    }, []);

    return { details: detailsById[circleId] ?? null, save };
}
