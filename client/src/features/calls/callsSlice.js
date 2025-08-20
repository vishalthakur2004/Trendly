import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

// Async thunks for API calls
export const initiateCall = createAsyncThunk(
    'calls/initiateCall',
    async ({ recipientId, callType, isGroupCall, token }, { rejectWithValue }) => {
        try {
            const response = await api.post('/api/call/initiate', {
                recipientId,
                callType,
                isGroupCall
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                return response.data.call;
            } else {
                return rejectWithValue(response.data.message);
            }
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to initiate call');
        }
    }
);

export const updateCallStatus = createAsyncThunk(
    'calls/updateCallStatus',
    async ({ callId, status, duration, token }, { rejectWithValue }) => {
        try {
            const response = await api.post('/api/call/update-status', {
                callId,
                status,
                duration
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                return response.data.call;
            } else {
                return rejectWithValue(response.data.message);
            }
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update call status');
        }
    }
);

export const addParticipantToCall = createAsyncThunk(
    'calls/addParticipant',
    async ({ callId, participantId, token }, { rejectWithValue }) => {
        try {
            const response = await api.post('/api/call/add-participant', {
                callId,
                participantId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                return response.data.call;
            } else {
                return rejectWithValue(response.data.message);
            }
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to add participant');
        }
    }
);

export const fetchCallHistory = createAsyncThunk(
    'calls/fetchHistory',
    async ({ page = 1, limit = 20, token }, { rejectWithValue }) => {
        try {
            const response = await api.get(`/api/call/history?page=${page}&limit=${limit}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                return response.data;
            } else {
                return rejectWithValue(response.data.message);
            }
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch call history');
        }
    }
);

export const fetchActiveCalls = createAsyncThunk(
    'calls/fetchActiveCalls',
    async ({ token }, { rejectWithValue }) => {
        try {
            const response = await api.get('/api/call/active', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                return response.data.activeCalls;
            } else {
                return rejectWithValue(response.data.message);
            }
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch active calls');
        }
    }
);

const callsSlice = createSlice({
    name: 'calls',
    initialState: {
        currentCall: null,
        incomingCall: null,
        callHistory: [],
        activeCalls: [],
        isCallActive: false,
        isCallInitiating: false,
        callStatus: null, // 'initiated', 'ringing', 'active', 'ended'
        participants: [],
        localStream: null,
        remoteStreams: {}, // userId -> stream
        mediaSettings: {
            isVideoEnabled: true,
            isAudioEnabled: true,
            isCameraOn: true,
            isMicOn: true
        },
        loading: false,
        error: null,
    },
    reducers: {
        setCurrentCall: (state, action) => {
            state.currentCall = action.payload;
        },
        setIncomingCall: (state, action) => {
            state.incomingCall = action.payload;
        },
        clearIncomingCall: (state) => {
            state.incomingCall = null;
        },
        setCallStatus: (state, action) => {
            state.callStatus = action.payload;
        },
        setCallActive: (state, action) => {
            state.isCallActive = action.payload;
        },
        setCallInitiating: (state, action) => {
            state.isCallInitiating = action.payload;
        },
        addParticipant: (state, action) => {
            const participant = action.payload;
            if (!state.participants.find(p => p._id === participant._id)) {
                state.participants.push(participant);
            }
        },
        removeParticipant: (state, action) => {
            const participantId = action.payload;
            state.participants = state.participants.filter(p => p._id !== participantId);
        },
        setParticipants: (state, action) => {
            state.participants = action.payload;
        },
        setLocalStream: (state, action) => {
            state.localStream = action.payload;
        },
        addRemoteStream: (state, action) => {
            const { userId, stream } = action.payload;
            state.remoteStreams[userId] = stream;
        },
        removeRemoteStream: (state, action) => {
            const userId = action.payload;
            delete state.remoteStreams[userId];
        },
        clearRemoteStreams: (state) => {
            state.remoteStreams = {};
        },
        updateMediaSettings: (state, action) => {
            state.mediaSettings = { ...state.mediaSettings, ...action.payload };
        },
        endCall: (state) => {
            state.currentCall = null;
            state.incomingCall = null;
            state.isCallActive = false;
            state.isCallInitiating = false;
            state.callStatus = 'ended';
            state.participants = [];
            state.localStream = null;
            state.remoteStreams = {};
            state.mediaSettings = {
                isVideoEnabled: true,
                isAudioEnabled: true,
                isCameraOn: true,
                isMicOn: true
            };
        },
        clearCallError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Initiate Call
            .addCase(initiateCall.pending, (state) => {
                state.loading = true;
                state.isCallInitiating = true;
                state.error = null;
            })
            .addCase(initiateCall.fulfilled, (state, action) => {
                state.loading = false;
                state.currentCall = action.payload;
                state.callStatus = 'initiated';
            })
            .addCase(initiateCall.rejected, (state, action) => {
                state.loading = false;
                state.isCallInitiating = false;
                state.error = action.payload;
            })
            
            // Update Call Status
            .addCase(updateCallStatus.fulfilled, (state, action) => {
                state.currentCall = action.payload;
                state.callStatus = action.payload.status;
            })
            
            // Add Participant
            .addCase(addParticipantToCall.fulfilled, (state, action) => {
                state.currentCall = action.payload;
                state.participants = action.payload.participants;
            })
            
            // Fetch Call History
            .addCase(fetchCallHistory.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCallHistory.fulfilled, (state, action) => {
                state.loading = false;
                state.callHistory = action.payload.calls;
            })
            .addCase(fetchCallHistory.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            
            // Fetch Active Calls
            .addCase(fetchActiveCalls.fulfilled, (state, action) => {
                state.activeCalls = action.payload;
            });
    }
});

export const {
    setCurrentCall,
    setIncomingCall,
    clearIncomingCall,
    setCallStatus,
    setCallActive,
    setCallInitiating,
    addParticipant,
    removeParticipant,
    setParticipants,
    setLocalStream,
    addRemoteStream,
    removeRemoteStream,
    clearRemoteStreams,
    updateMediaSettings,
    endCall,
    clearCallError
} = callsSlice.actions;

export default callsSlice.reducer;
