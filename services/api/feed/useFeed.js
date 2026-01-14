import { privateApi } from "../base";
import { usePStore } from "../../storage/store/postStore";
import { useState } from "react";

export const useFeed = (feedKey = 'foryou') => {
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const {
        getFeedPosts,
        addPosts,
        pagination,
    } = usePStore();

    const fetchFeed = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setIsRefreshing(true);
            } else {
                setIsLoading(true);
            }
            
            setError(null);

            const currentPage = pagination[feedKey]?.page || 1;
            const targetPage = isRefresh ? 1 : currentPage + 1;
            
            const response = await privateApi.get(
                `/api/p/v1/feed/personalized?page=${targetPage}&limit=20`
            );

            const postIds = addPosts(response.data, feedKey);
            
            console.log(response.data);
            console.log('Feed key:', feedKey);
            console.log('Post IDs returned from addPosts:', postIds);
            return response.data;
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch posts';
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    const refresh = () => fetchFeed(true);
    const loadMore = () => fetchFeed(false);

    
    const hasNext = pagination[feedKey]?.hasNext || false;

    return {
        isLoading,
        isRefreshing,
        error,
        hasNext,
        refresh,
        loadMore,
        fetchFeed,
        feedKey,
    };
};