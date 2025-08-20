import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search, X, UserPlus, Check } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import toast from 'react-hot-toast';
import socketService from '../services/socketService';
import { addParticipantToCall } from '../features/calls/callsSlice';

const AddParticipantModal = ({ callId, onClose }) => {
    const dispatch = useDispatch();
    const { getToken } = useAuth();
    const { connections } = useSelector(state => state.connections);
    const { participants } = useSelector(state => state.calls);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [isAdding, setIsAdding] = useState(false);

    // Filter connections that are not already in the call
    const availableConnections = connections.filter(connection => 
        !participants.some(participant => participant._id === connection._id) &&
        (connection.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
         connection.username.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleUserSelect = (user) => {
        setSelectedUsers(prev => {
            const isSelected = prev.some(u => u._id === user._id);
            if (isSelected) {
                return prev.filter(u => u._id !== user._id);
            } else {
                return [...prev, user];
            }
        });
    };

    const handleAddParticipants = async () => {
        if (selectedUsers.length === 0) {
            toast.error('Please select at least one person to add');
            return;
        }

        setIsAdding(true);
        
        try {
            const token = await getToken();
            
            // Add each selected user to the call
            for (const user of selectedUsers) {
                // Update call in database
                await dispatch(addParticipantToCall({
                    callId,
                    participantId: user._id,
                    token
                })).unwrap();
                
                // Notify via socket
                socketService.addParticipant({
                    callId,
                    participantId: user._id,
                    participantData: user
                });
            }
            
            toast.success(`Added ${selectedUsers.length} ${selectedUsers.length === 1 ? 'participant' : 'participants'} to the call`);
            onClose();
            
        } catch (error) {
            console.error('Error adding participants:', error);
            toast.error('Failed to add participants');
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Add to Call</h3>
                    <button 
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-gray-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search connections..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Selected Users */}
                {selectedUsers.length > 0 && (
                    <div className="p-4 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                            Selected ({selectedUsers.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {selectedUsers.map(user => (
                                <div 
                                    key={user._id}
                                    className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                                >
                                    <img 
                                        src={user.profile_picture} 
                                        alt={user.full_name}
                                        className="w-5 h-5 rounded-full"
                                    />
                                    <span>{user.full_name}</span>
                                    <button 
                                        onClick={() => handleUserSelect(user)}
                                        className="text-blue-600 hover:text-blue-800"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Connections List */}
                <div className="flex-1 overflow-y-auto">
                    {availableConnections.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            {searchTerm ? 'No connections found' : 'All your connections are already in this call'}
                        </div>
                    ) : (
                        <div className="p-2">
                            {availableConnections.map(connection => {
                                const isSelected = selectedUsers.some(u => u._id === connection._id);
                                return (
                                    <button
                                        key={connection._id}
                                        onClick={() => handleUserSelect(connection)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors ${
                                            isSelected ? 'bg-blue-50 border-2 border-blue-200' : ''
                                        }`}
                                    >
                                        <img 
                                            src={connection.profile_picture} 
                                            alt={connection.full_name}
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                        <div className="flex-1 text-left">
                                            <div className="font-medium text-sm text-gray-900">
                                                {connection.full_name}
                                            </div>
                                            <div className="text-gray-500 text-xs">
                                                @{connection.username}
                                            </div>
                                        </div>
                                        {isSelected && (
                                            <div className="text-blue-500">
                                                <Check className="w-5 h-5" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200">
                    <div className="flex gap-3">
                        <button 
                            onClick={onClose}
                            className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleAddParticipants}
                            disabled={selectedUsers.length === 0 || isAdding}
                            className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isAdding ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <UserPlus className="w-4 h-4" />
                                    Add to Call
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddParticipantModal;
