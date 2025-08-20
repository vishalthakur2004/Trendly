import express from 'express';
import { upload } from '../configs/multer.js';
import { protect } from '../middlewares/auth.js';
import {
    addPost,
    getFeedPosts,
    likePost,
    sharePost,
    getUserConnections
} from '../controllers/postController.js';

const postRouter = express.Router()

postRouter.post('/add', upload.array('images', 4), protect, addPost)
postRouter.get('/feed', protect, getFeedPosts)
postRouter.post('/like', protect, likePost)
postRouter.post('/share', protect, sharePost)
postRouter.get('/connections', protect, getUserConnections)

export default postRouter
