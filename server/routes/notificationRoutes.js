import express from 'express';
import { protect } from '../middlewares/auth.js';
import { 
    getNotifications, 
    markAsRead, 
    deleteNotification,
    getNotificationStats
} from '../controllers/notificationController.js';

const notificationRouter = express.Router();

notificationRouter.get('/', protect, getNotifications);
notificationRouter.post('/mark-read', protect, markAsRead);
notificationRouter.delete('/delete', protect, deleteNotification);
notificationRouter.get('/stats', protect, getNotificationStats);

export default notificationRouter;
