import express from 'express';
import { protect } from '../middlewares/auth.js';
import { 
    addComment, 
    getComments, 
    getReplies, 
    likeComment, 
    deleteComment 
} from '../controllers/commentController.js';

const commentRouter = express.Router();

commentRouter.post('/add', protect, addComment);
commentRouter.get('/post/:postId', protect, getComments);
commentRouter.get('/replies/:commentId', protect, getReplies);
commentRouter.post('/like', protect, likeComment);
commentRouter.delete('/delete', protect, deleteComment);

export default commentRouter;
