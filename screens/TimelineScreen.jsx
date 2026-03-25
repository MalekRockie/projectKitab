import React, { useCallback, useEffect, useRef } from 'react';
import { 
    View, 
    FlatList, 
    StyleSheet, 
    ActivityIndicator, 
    Text,
    RefreshControl 
} from 'react-native';
import { useFeed } from '../services/api/feed/useFeed'; 
import { usePStore } from '../services/storage/store/postStore';
import PostComponent from '../components/posts/postComp';
import { shallow } from 'zustand/shallow';

export const TimelineScreen = ({ tabType = 'foryou' }) => {
    const hasInitialFetch = useRef(false);
    
    const {
        isLoading,
        isRefreshing,
        error,
        hasNext,
        refresh,
        loadMore,
        feedKey
    } = useFeed(tabType);

    const postIds = usePStore(
        state => state.feeds[feedKey] || [],
        shallow
    );

    useEffect(() => {
        if(!hasInitialFetch.current || hasInitialFetch.current !== tabType){
            hasInitialFetch.current = tabType;
            refresh();
            // console.log(tabType);
        }
    }, [tabType]);

    const handleEndReached = () => {
        if (hasNext && !isLoading && !isRefreshing) {
        loadMore();
        }
    };

    const renderPost = useCallback(({ item: postId }) => (
        <PostComponent postId={postId} />
    ), []);

    const renderFooter = () => {
        if (!isLoading) return null;
        return (
        <View style={styles.footerLoader}>
            <ActivityIndicator size="small" color="#0000ff" />
        </View>
        );
    };

    const renderEmpty = useCallback(() => {
        if (isLoading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
        }

        if (error) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>Error: {error}</Text>
                <Text 
                    style={styles.retryText} 
                    onPress={refresh}
                >
                    Tap to retry
                </Text>
            </View>
        );
        }

        return (
        <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>No posts yet</Text>
        </View>
        );
    }, [isLoading, error, refresh]);

    return (
        <View style={styles.container}>
            <FlatList
                data={postIds}
                renderItem={renderPost}
                keyExtractor={(postId) => postId.toString()}
                onEndReached={handleEndReached}
                onEndReachedThreshold={0.5}
                ListFooterComponent={renderFooter}
                ListEmptyComponent={renderEmpty}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={refresh}
                    />
                }/>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        minHeight: 400,
    },
    footerLoader: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    errorText: {
        fontSize: 16,
        color: '#ff0000',
        marginBottom: 10,
    },
    retryText: {
        fontSize: 14,
        color: '#0000ff',
        textDecorationLine: 'underline',
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
    },
});

export default TimelineScreen;