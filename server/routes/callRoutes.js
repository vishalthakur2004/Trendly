import express from 'express';
import { protect } from '../middlewares/auth.js';
import { 
    initiateCall, 
    updateCallStatus, 
    addParticipant,
    getCallHistory,
    getActiveCalls
} from '../controllers/callController.js';

const callRouter = express.Router();

callRouter.post('/initiate', protect, initiateCall);
callRouter.post('/update-status', protect, updateCallStatus);
callRouter.post('/add-participant', protect, addParticipant);
callRouter.get('/history', protect, getCallHistory);
callRouter.get('/active', protect, getActiveCalls);

export default callRouter;
