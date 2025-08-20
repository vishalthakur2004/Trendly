import express from 'express';
import { protect } from '../middlewares/auth.js';
import { upload } from '../configs/multer.js';
import {
    createGroup,
    getUserGroups,
    getGroupDetails,
    updateGroup,
    joinGroup,
    leaveGroup,
    inviteMember,
    acceptInvitation,
    removeMember,
    updateMemberRole,
    discoverGroups,
    deleteGroup
} from '../controllers/groupController.js';

import {
    createGroupPost,
    getGroupPosts,
    getPendingPosts,
    moderatePost,
    toggleLikeGroupPost,
    togglePinPost,
    deleteGroupPost,
    voteOnPoll
} from '../controllers/groupPostController.js';

import {
    sendGroupMessage,
    getGroupMessages,
    markMessagesAsSeen,
    addReaction,
    removeReaction,
    deleteGroupMessage,
    editGroupMessage,
    getUnreadCount
} from '../controllers/groupMessageController.js';

const groupRouter = express.Router();

// Group management routes
groupRouter.post('/create', upload.fields([
    { name: 'profile_picture', maxCount: 1 },
    { name: 'cover_photo', maxCount: 1 }
]), protect, createGroup);

groupRouter.get('/my-groups', protect, getUserGroups);
groupRouter.get('/discover', protect, discoverGroups);
groupRouter.get('/:groupId', protect, getGroupDetails);

groupRouter.put('/:groupId', upload.fields([
    { name: 'profile_picture', maxCount: 1 },
    { name: 'cover_photo', maxCount: 1 }
]), protect, updateGroup);

groupRouter.delete('/:groupId', protect, deleteGroup);

// Member management routes
groupRouter.post('/:groupId/join', protect, joinGroup);
groupRouter.post('/:groupId/leave', protect, leaveGroup);
groupRouter.post('/:groupId/invite', protect, inviteMember);
groupRouter.post('/:groupId/accept-invitation', protect, acceptInvitation);
groupRouter.post('/:groupId/remove-member', protect, removeMember);
groupRouter.post('/:groupId/update-role', protect, updateMemberRole);

// Group post routes
groupRouter.post('/:groupId/posts', protect, createGroupPost);
groupRouter.get('/:groupId/posts', protect, getGroupPosts);
groupRouter.get('/:groupId/posts/pending', protect, getPendingPosts);
groupRouter.post('/:groupId/posts/:postId/moderate', protect, moderatePost);
groupRouter.post('/:groupId/posts/:postId/like', protect, toggleLikeGroupPost);
groupRouter.post('/:groupId/posts/:postId/pin', protect, togglePinPost);
groupRouter.delete('/:groupId/posts/:postId', protect, deleteGroupPost);
groupRouter.post('/:groupId/posts/:postId/vote', protect, voteOnPoll);

// Group message routes
groupRouter.post('/:groupId/messages', protect, sendGroupMessage);
groupRouter.get('/:groupId/messages', protect, getGroupMessages);
groupRouter.post('/:groupId/messages/mark-seen', protect, markMessagesAsSeen);
groupRouter.get('/:groupId/messages/unread-count', protect, getUnreadCount);
groupRouter.post('/:groupId/messages/:messageId/reaction', protect, addReaction);
groupRouter.delete('/:groupId/messages/:messageId/reaction', protect, removeReaction);
groupRouter.put('/:groupId/messages/:messageId', protect, editGroupMessage);
groupRouter.delete('/:groupId/messages/:messageId', protect, deleteGroupMessage);

export default groupRouter;
