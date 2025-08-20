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

export default groupRouter;
