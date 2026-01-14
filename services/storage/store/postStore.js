import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const normalizePosts = (postsArray) => {
    const entities = {
        posts: {},
        users: {},
        postblocks: {},
    };
    
    const postIds = [];
    
    postsArray.forEach(post => {
        entities.posts[post.id] = {
            id: post.id,
            userId: post.user_id,
            likesCount: post.likes_count,
            commentCount: post.comments_count,
            privacyLevel: post.privacy_level,
            createdAt: post.created_at,
            editedAt: post.edited_at,
            isLiked: post.is_liked,
            blockIds: post.postblocks.map(block => block.id),
        };
        
        entities.users[post.user_id] = {
            id: post.user_id,
            username: post.username,
            avatar: post.user_avatar,
        };
        
        post.postblocks.forEach(block => {
            entities.postblocks[block.id] = {
                id: block.id,
                blockType: block.block_type,
                content: block.content,
                displayOrder: block.display_order,
                createdAt: block.created_at,
                postId: post.id,
                };
            });
            postIds.push(post.id);
        });
        
    // console.log("logarray: ", postsArray);
    return {entities, postIds};
};


const enrichedPostsCache = new Map();


const enrichPost = (postId, entities) => {
    const post = entities.posts[postId];
    if (!post) {
        enrichedPostsCache.delete(postId);
        return null;
    }

    const cacheKey = `${postId}-${post.likesCount}-${post.commentCount}-${post.isLiked}-${post.editedAt}`;
    if (enrichedPostsCache.has(cacheKey)) {
        return enrichedPostsCache.get(cacheKey);
    }
    const user = entities.users[post.userId];
    const blocks = post.blockIds
        .map(id => entities.postblocks[id])
        .filter(Boolean)
        .sort((a, b) => a.displayOrder - b.displayOrder);

    const enrichedPost = {
        ...post,
        user,
        postblocks: blocks,
    };

    for (const key of enrichedPostsCache.keys()){
        if(key.startsWith(`${postId}-`)){
            enrichedPostsCache.delete(key);
        }
    }

    enrichedPostsCache.set(cacheKey, enrichedPost);
    return enrichedPost;
};


export const usePStore = create(
    persist(
        (set, get) => ({
            entities: {
                posts: {},
                users: {},
                postblocks: {},
            },

            feeds: {
                foryou: [],
                following: [],
                community: {},
            },

            pagination: {
                foryou: { page: 1, hasNext: false, totalPosts: 0},
                following: { page: 1, hasNext: false, totalPosts: 0},
            },

            ui: {
                activeTab: 'foryou',
                visiblePosts: new Set(),
                isLoading: false,
            },


            addPosts: (apiResponse, feedKey = 'foryou') => {
                const { posts, pagination } = apiResponse;
                // console.log('addPosts called with feedKey:', feedKey);
                // console.log('Posts array:', posts);
                const { entities: normalized, postIds } = normalizePosts(posts);
                // console.log('Normalized postIds:', postIds);

                set(state => {
                    const newState = {
                        ...state,
                        entities: {
                            posts: { ...state.entities.posts, ...normalized.posts },
                            users: { ...state.entities.users, ...normalized.users },
                            postblocks: { ...state.entities.postblocks, ...normalized.postblocks },
                        },
                        pagination : {
                            ...state.pagination, 
                            [feedKey]: {
                                page: pagination.page,
                                hasNext: pagination.has_next,
                                totalPosts: pagination.total_posts,
                            }
                        }
                    };

                    if(pagination.page === 1) {
                        newState.feeds[feedKey] = postIds;
                    } else {
                        newState.feeds[feedKey] = [...state.feeds[feedKey], ...postIds];
                    }

                    return newState;
                });

                return postIds;
            },

            getFeedPosts: (feedKey = 'foryou') => {
                const {entities, feeds}  = get();
                const feedIds = feeds[feedKey] || [];

                return feedIds 
                    .map(id => enrichPost(id, entities))
                    .filter(Boolean);
            },

            getPost: (postId) => {
                const {entities} = get();
                return enrichPost(postId, entities);
            },

            updatePost: (postId, updates) => {
                set(state => ({
                    entities :{
                        ...state.entities,
                        posts: {
                            ...state.entities.posts,
                            [postId]: {
                                ...state.entities.posts[postId],
                                ...updates,
                            }
                        }
                    }
                }));
            },

            clearFeed: (feedKey) => {
                set(state => ({
                    feeds: { ...state.feeds, [feedKey]: []},
                    pagination: { ...state.pagination, [feedKey]: { page: 1, hasNext: false }}
                }));
            },

            
        }),

        {
            name: 'post-store',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                entities: state.entities,
                feeds: state.feeds,
                pagination: state.pagination,
            }),

            merge: (persistedState, currentState) => ({
                ...currentState, 
                ...persistedState,
                ui: currentState.ui,
            }),
        }
    )
);