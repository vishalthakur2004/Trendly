import { configureStore } from '@reduxjs/toolkit'
import userReducer from '../features/user/userSlice.js'
import connectionsReducer from '../features/connections/connectionsSlice.js'
import messagesReducer from '../features/messages/messagesSlice.js'
import commentsReducer from '../features/comments/commentsSlice.js'
import postsReducer from '../features/posts/postsSlice.js'
import notificationsReducer from '../features/notifications/notificationsSlice.js'
import callsReducer from '../features/calls/callsSlice.js'
import groupsReducer from '../features/groups/groupsSlice.js'
import groupPostsReducer from '../features/groups/groupPostsSlice.js'
import bookmarksReducer from '../features/bookmarks/bookmarksSlice.js'

export const store = configureStore({
    reducer: {
       user: userReducer,
       connections: connectionsReducer,
       messages: messagesReducer,
       comments: commentsReducer,
       posts: postsReducer,
       notifications: notificationsReducer,
       calls: callsReducer,
       groups: groupsReducer,
       groupPosts: groupPostsReducer,
       bookmarks: bookmarksReducer
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: ['calls/setLocalStream', 'calls/addRemoteStream'],
                ignoredPaths: ['calls.localStream', 'calls.remoteStreams']
            }
        })
})
