import express from 'express';
import { 
    toggleBookmark, 
    getBookmarkedPosts, 
    checkBookmarkStatus 
} from '../controllers/bookmarkController.js';

const bookmarkRouter = express.Router();

// Toggle bookmark for a post
bookmarkRouter.post('/toggle', toggleBookmark);

// Get user's bookmarked posts
bookmarkRouter.get('/', getBookmarkedPosts);

// Check bookmark status for multiple posts
bookmarkRouter.post('/status', checkBookmarkStatus);

export default bookmarkRouter;
