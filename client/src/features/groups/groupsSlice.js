import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

// Async thunks for API calls
export const createGroup = createAsyncThunk(
    'groups/createGroup',
    async ({ groupData, token }, { rejectWithValue }) => {
        try {
            const formData = new FormData();
            
            // Add text fields
            Object.keys(groupData).forEach(key => {
                if (key !== 'profile_picture' && key !== 'cover_photo') {
                    if (Array.isArray(groupData[key])) {
                        formData.append(key, JSON.stringify(groupData[key]));
                    } else if (typeof groupData[key] === 'object') {
                        formData.append(key, JSON.stringify(groupData[key]));
                    } else {
                        formData.append(key, groupData[key]);
                    }
                }
            });
            
            // Add files
            if (groupData.profile_picture) {
                formData.append('profile_picture', groupData.profile_picture);
            }
            if (groupData.cover_photo) {
                formData.append('cover_photo', groupData.cover_photo);
            }
            
            const response = await api.post('/api/group/create', formData, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            if (response.data.success) {
                return response.data.group;
            } else {
                return rejectWithValue(response.data.message);
            }
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to create group');
        }
    }
);

export const getUserGroups = createAsyncThunk(
    'groups/getUserGroups',
    async ({ page = 1, limit = 20, filter = 'all', token }, { rejectWithValue }) => {
        try {
            const response = await api.get(`/api/group/my-groups?page=${page}&limit=${limit}&filter=${filter}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                return response.data;
            } else {
                return rejectWithValue(response.data.message);
            }
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch groups');
        }
    }
);

export const getGroupDetails = createAsyncThunk(
    'groups/getGroupDetails',
    async ({ groupId, token }, { rejectWithValue }) => {
        try {
            const response = await api.get(`/api/group/${groupId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                return response.data.group;
            } else {
                return rejectWithValue(response.data.message);
            }
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch group details');
        }
    }
);

export const updateGroup = createAsyncThunk(
    'groups/updateGroup',
    async ({ groupId, groupData, token }, { rejectWithValue }) => {
        try {
            const formData = new FormData();
            
            // Add text fields
            Object.keys(groupData).forEach(key => {
                if (key !== 'profile_picture' && key !== 'cover_photo') {
                    if (Array.isArray(groupData[key])) {
                        formData.append(key, JSON.stringify(groupData[key]));
                    } else if (typeof groupData[key] === 'object') {
                        formData.append(key, JSON.stringify(groupData[key]));
                    } else {
                        formData.append(key, groupData[key]);
                    }
                }
            });
            
            // Add files
            if (groupData.profile_picture) {
                formData.append('profile_picture', groupData.profile_picture);
            }
            if (groupData.cover_photo) {
                formData.append('cover_photo', groupData.cover_photo);
            }
            
            const response = await api.put(`/api/group/${groupId}`, formData, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            if (response.data.success) {
                return response.data.group;
            } else {
                return rejectWithValue(response.data.message);
            }
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update group');
        }
    }
);

export const joinGroup = createAsyncThunk(
    'groups/joinGroup',
    async ({ groupId, token }, { rejectWithValue }) => {
        try {
            const response = await api.post(`/api/group/${groupId}/join`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                return response.data.group;
            } else {
                return rejectWithValue(response.data.message);
            }
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to join group');
        }
    }
);

export const leaveGroup = createAsyncThunk(
    'groups/leaveGroup',
    async ({ groupId, token }, { rejectWithValue }) => {
        try {
            const response = await api.post(`/api/group/${groupId}/leave`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                return groupId;
            } else {
                return rejectWithValue(response.data.message);
            }
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to leave group');
        }
    }
);

export const inviteMember = createAsyncThunk(
    'groups/inviteMember',
    async ({ groupId, memberId, token }, { rejectWithValue }) => {
        try {
            const response = await api.post(`/api/group/${groupId}/invite`, {
                memberId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                return { groupId, memberId };
            } else {
                return rejectWithValue(response.data.message);
            }
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to invite member');
        }
    }
);

export const acceptInvitation = createAsyncThunk(
    'groups/acceptInvitation',
    async ({ groupId, token }, { rejectWithValue }) => {
        try {
            const response = await api.post(`/api/group/${groupId}/accept-invitation`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                return response.data.group;
            } else {
                return rejectWithValue(response.data.message);
            }
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to accept invitation');
        }
    }
);

export const removeMember = createAsyncThunk(
    'groups/removeMember',
    async ({ groupId, memberId, token }, { rejectWithValue }) => {
        try {
            const response = await api.post(`/api/group/${groupId}/remove-member`, {
                memberId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                return { groupId, memberId };
            } else {
                return rejectWithValue(response.data.message);
            }
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to remove member');
        }
    }
);

export const updateMemberRole = createAsyncThunk(
    'groups/updateMemberRole',
    async ({ groupId, memberId, newRole, token }, { rejectWithValue }) => {
        try {
            const response = await api.post(`/api/group/${groupId}/update-role`, {
                memberId,
                newRole
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                return { groupId, memberId, newRole };
            } else {
                return rejectWithValue(response.data.message);
            }
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update member role');
        }
    }
);

export const discoverGroups = createAsyncThunk(
    'groups/discoverGroups',
    async ({ search = '', category = '', page = 1, limit = 20, privacy = 'public', token }, { rejectWithValue }) => {
        try {
            const params = new URLSearchParams({
                search,
                category,
                page: page.toString(),
                limit: limit.toString(),
                privacy
            });
            
            const response = await api.get(`/api/group/discover?${params}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                return response.data;
            } else {
                return rejectWithValue(response.data.message);
            }
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to discover groups');
        }
    }
);

export const deleteGroup = createAsyncThunk(
    'groups/deleteGroup',
    async ({ groupId, token }, { rejectWithValue }) => {
        try {
            const response = await api.delete(`/api/group/${groupId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                return groupId;
            } else {
                return rejectWithValue(response.data.message);
            }
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to delete group');
        }
    }
);

const groupsSlice = createSlice({
    name: 'groups',
    initialState: {
        userGroups: [],
        discoveredGroups: [],
        currentGroup: null,
        groupMembers: [],
        loading: false,
        error: null,
        pagination: {
            userGroups: {
                currentPage: 1,
                totalPages: 1,
                totalGroups: 0
            },
            discoveredGroups: {
                currentPage: 1,
                totalPages: 1,
                totalGroups: 0
            }
        }
    },
    reducers: {
        clearGroupError: (state) => {
            state.error = null;
        },
        setCurrentGroup: (state, action) => {
            state.currentGroup = action.payload;
        },
        clearCurrentGroup: (state) => {
            state.currentGroup = null;
        },
        updateGroupLocally: (state, action) => {
            const updatedGroup = action.payload;
            
            // Update in userGroups
            const userGroupIndex = state.userGroups.findIndex(group => group._id === updatedGroup._id);
            if (userGroupIndex !== -1) {
                state.userGroups[userGroupIndex] = updatedGroup;
            }
            
            // Update in discoveredGroups
            const discoveredGroupIndex = state.discoveredGroups.findIndex(group => group._id === updatedGroup._id);
            if (discoveredGroupIndex !== -1) {
                state.discoveredGroups[discoveredGroupIndex] = updatedGroup;
            }
            
            // Update currentGroup if it's the same
            if (state.currentGroup && state.currentGroup._id === updatedGroup._id) {
                state.currentGroup = updatedGroup;
            }
        },
        addMemberToGroup: (state, action) => {
            const { groupId, member } = action.payload;
            
            if (state.currentGroup && state.currentGroup._id === groupId) {
                state.currentGroup.members.push(member);
                state.currentGroup.stats.member_count += 1;
            }
        },
        removeMemberFromGroup: (state, action) => {
            const { groupId, memberId } = action.payload;
            
            if (state.currentGroup && state.currentGroup._id === groupId) {
                state.currentGroup.members = state.currentGroup.members.filter(
                    member => member.user._id !== memberId
                );
                state.currentGroup.stats.member_count -= 1;
            }
        }
    },
    extraReducers: (builder) => {
        builder
            // Create Group
            .addCase(createGroup.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createGroup.fulfilled, (state, action) => {
                state.loading = false;
                state.userGroups.unshift(action.payload);
                state.currentGroup = action.payload;
            })
            .addCase(createGroup.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            
            // Get User Groups
            .addCase(getUserGroups.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getUserGroups.fulfilled, (state, action) => {
                state.loading = false;
                const { groups, currentPage, totalPages, totalGroups } = action.payload;
                
                if (currentPage === 1) {
                    state.userGroups = groups;
                } else {
                    state.userGroups.push(...groups);
                }
                
                state.pagination.userGroups = {
                    currentPage,
                    totalPages,
                    totalGroups
                };
            })
            .addCase(getUserGroups.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            
            // Get Group Details
            .addCase(getGroupDetails.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getGroupDetails.fulfilled, (state, action) => {
                state.loading = false;
                state.currentGroup = action.payload;
            })
            .addCase(getGroupDetails.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            
            // Update Group
            .addCase(updateGroup.fulfilled, (state, action) => {
                const updatedGroup = action.payload;
                
                // Update in userGroups
                const userGroupIndex = state.userGroups.findIndex(group => group._id === updatedGroup._id);
                if (userGroupIndex !== -1) {
                    state.userGroups[userGroupIndex] = updatedGroup;
                }
                
                // Update currentGroup
                if (state.currentGroup && state.currentGroup._id === updatedGroup._id) {
                    state.currentGroup = updatedGroup;
                }
            })
            
            // Join Group
            .addCase(joinGroup.fulfilled, (state, action) => {
                const joinedGroup = action.payload;
                state.userGroups.unshift(joinedGroup);
                
                // Remove from discovered groups
                state.discoveredGroups = state.discoveredGroups.filter(
                    group => group._id !== joinedGroup._id
                );
            })
            
            // Leave Group
            .addCase(leaveGroup.fulfilled, (state, action) => {
                const groupId = action.payload;
                state.userGroups = state.userGroups.filter(group => group._id !== groupId);
                
                if (state.currentGroup && state.currentGroup._id === groupId) {
                    state.currentGroup = null;
                }
            })
            
            // Accept Invitation
            .addCase(acceptInvitation.fulfilled, (state, action) => {
                const joinedGroup = action.payload;
                state.userGroups.unshift(joinedGroup);
            })
            
            // Discover Groups
            .addCase(discoverGroups.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(discoverGroups.fulfilled, (state, action) => {
                state.loading = false;
                const { groups, currentPage, totalPages, totalGroups } = action.payload;
                
                if (currentPage === 1) {
                    state.discoveredGroups = groups;
                } else {
                    state.discoveredGroups.push(...groups);
                }
                
                state.pagination.discoveredGroups = {
                    currentPage,
                    totalPages,
                    totalGroups
                };
            })
            .addCase(discoverGroups.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            
            // Delete Group
            .addCase(deleteGroup.fulfilled, (state, action) => {
                const groupId = action.payload;
                state.userGroups = state.userGroups.filter(group => group._id !== groupId);
                
                if (state.currentGroup && state.currentGroup._id === groupId) {
                    state.currentGroup = null;
                }
            });
    }
});

export const {
    clearGroupError,
    setCurrentGroup,
    clearCurrentGroup,
    updateGroupLocally,
    addMemberToGroup,
    removeMemberFromGroup
} = groupsSlice.actions;

export default groupsSlice.reducer;
