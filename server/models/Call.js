import mongoose from 'mongoose';

const callSchema = new mongoose.Schema({
    call_id: { 
        type: String, 
        required: true, 
        unique: true 
    },
    initiator: { 
        type: String, 
        ref: 'User', 
        required: true 
    },
    participants: [{ 
        type: String, 
        ref: 'User' 
    }],
    call_type: { 
        type: String, 
        enum: ['voice', 'video'], 
        required: true 
    },
    status: { 
        type: String, 
        enum: ['initiated', 'ringing', 'active', 'ended', 'missed', 'declined'], 
        default: 'initiated' 
    },
    started_at: { 
        type: Date 
    },
    ended_at: { 
        type: Date 
    },
    duration: { 
        type: Number, 
        default: 0 
    }, // Duration in seconds
    is_group_call: {
        type: Boolean,
        default: false
    },
    group_id: {
        type: String,
        ref: 'Group'
    }
}, { 
    timestamps: true, 
    minimize: false 
});

// Index for better query performance
callSchema.index({ initiator: 1, createdAt: -1 });
callSchema.index({ participants: 1, createdAt: -1 });

const Call = mongoose.model('Call', callSchema);

export default Call;
