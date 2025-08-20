import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useAuth } from '@clerk/clerk-react';
import { X, Upload, Globe, Lock, EyeOff, Users, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { createGroup } from '../features/groups/groupsSlice';

const CreateGroupModal = ({ onClose, onGroupCreated }) => {
    const dispatch = useDispatch();
    const { getToken } = useAuth();
    
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        privacy: 'public',
        category: 'general',
        tags: '',
        profile_picture: null,
        cover_photo: null,
        settings: {
            allow_member_posts: true,
            allow_member_invites: false,
            post_approval_required: false,
            allow_member_calls: true,
            allow_file_sharing: true,
            max_members: 1000
        }
    });
    
    const [profilePreview, setProfilePreview] = useState(null);
    const [coverPreview, setCoverPreview] = useState(null);
    const [isCreating, setIsCreating] = useState(false);

    const categories = [
        { value: 'general', label: 'General' },
        { value: 'technology', label: 'Technology' },
        { value: 'business', label: 'Business' },
        { value: 'entertainment', label: 'Entertainment' },
        { value: 'education', label: 'Education' },
        { value: 'sports', label: 'Sports' },
        { value: 'health', label: 'Health & Wellness' },
        { value: 'travel', label: 'Travel' },
        { value: 'food', label: 'Food & Cooking' },
        { value: 'arts', label: 'Arts & Culture' }
    ];

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        if (name.startsWith('settings.')) {
            const settingName = name.replace('settings.', '');
            setFormData(prev => ({
                ...prev,
                settings: {
                    ...prev.settings,
                    [settingName]: type === 'checkbox' ? checked : value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('File size must be less than 5MB');
                return;
            }

            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast.error('Please select an image file');
                return;
            }

            setFormData(prev => ({
                ...prev,
                [type]: file
            }));

            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                if (type === 'profile_picture') {
                    setProfilePreview(e.target.result);
                } else {
                    setCoverPreview(e.target.result);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.name.trim()) {
            toast.error('Group name is required');
            return;
        }

        setIsCreating(true);
        
        try {
            const token = await getToken();
            
            // Prepare data for submission
            const groupData = {
                ...formData,
                tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : []
            };
            
            const result = await dispatch(createGroup({ groupData, token })).unwrap();
            
            toast.success('Group created successfully!');
            
            if (onGroupCreated) {
                onGroupCreated(result);
            }
            
        } catch (error) {
            console.error('Error creating group:', error);
            toast.error(error || 'Failed to create group');
        } finally {
            setIsCreating(false);
        }
    };

    const getPrivacyDescription = (privacy) => {
        switch (privacy) {
            case 'public':
                return 'Anyone can find and join this group';
            case 'private':
                return 'Anyone can find this group, but only invited members can join';
            case 'secret':
                return 'Only invited members can find and join this group';
            default:
                return '';
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Create New Group</h2>
                    <button 
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Cover Photo */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cover Photo (Optional)
                        </label>
                        <div className="relative">
                            <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg overflow-hidden">
                                {coverPreview ? (
                                    <img 
                                        src={coverPreview} 
                                        alt="Cover preview"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <ImageIcon className="w-8 h-8 text-white opacity-50" />
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleFileChange(e, 'cover_photo')}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                            </div>
                            <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                                Click to upload
                            </div>
                        </div>
                    </div>

                    {/* Profile Picture */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Group Profile Picture (Optional)
                        </label>
                        <div className="flex items-center gap-4">
                            <div className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-gray-200">
                                {profilePreview ? (
                                    <img 
                                        src={profilePreview} 
                                        alt="Profile preview"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                        <Users className="w-6 h-6 text-gray-400" />
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleFileChange(e, 'profile_picture')}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                            </div>
                            <div className="text-sm text-gray-500">
                                Click to upload a group picture
                            </div>
                        </div>
                    </div>

                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                Group Name *
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="Enter group name"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                                Category
                            </label>
                            <select
                                id="category"
                                name="category"
                                value={formData.category}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {categories.map(category => (
                                    <option key={category.value} value={category.value}>
                                        {category.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            placeholder="Describe what your group is about..."
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Privacy Settings */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Privacy
                        </label>
                        <div className="space-y-2">
                            {['public', 'private', 'secret'].map(privacy => (
                                <label key={privacy} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                                    <input
                                        type="radio"
                                        name="privacy"
                                        value={privacy}
                                        checked={formData.privacy === privacy}
                                        onChange={handleInputChange}
                                        className="mt-1"
                                    />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            {privacy === 'public' && <Globe className="w-4 h-4 text-green-500" />}
                                            {privacy === 'private' && <Lock className="w-4 h-4 text-orange-500" />}
                                            {privacy === 'secret' && <EyeOff className="w-4 h-4 text-red-500" />}
                                            <span className="font-medium capitalize">{privacy}</span>
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            {getPrivacyDescription(privacy)}
                                        </p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Tags */}
                    <div>
                        <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
                            Tags (Optional)
                        </label>
                        <input
                            type="text"
                            id="tags"
                            name="tags"
                            value={formData.tags}
                            onChange={handleInputChange}
                            placeholder="technology, startup, networking (separate with commas)"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Add relevant tags to help people discover your group
                        </p>
                    </div>

                    {/* Group Settings */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Group Settings
                        </label>
                        <div className="space-y-3">
                            <label className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    name="settings.allow_member_posts"
                                    checked={formData.settings.allow_member_posts}
                                    onChange={handleInputChange}
                                    className="rounded"
                                />
                                <span className="text-sm">Allow members to create posts</span>
                            </label>
                            
                            <label className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    name="settings.allow_member_invites"
                                    checked={formData.settings.allow_member_invites}
                                    onChange={handleInputChange}
                                    className="rounded"
                                />
                                <span className="text-sm">Allow members to invite others</span>
                            </label>
                            
                            <label className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    name="settings.post_approval_required"
                                    checked={formData.settings.post_approval_required}
                                    onChange={handleInputChange}
                                    className="rounded"
                                />
                                <span className="text-sm">Require admin approval for posts</span>
                            </label>
                            
                            <label className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    name="settings.allow_member_calls"
                                    checked={formData.settings.allow_member_calls}
                                    onChange={handleInputChange}
                                    className="rounded"
                                />
                                <span className="text-sm">Allow group voice/video calls</span>
                            </label>
                        </div>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isCreating || !formData.name.trim()}
                            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                        >
                            {isCreating ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Group'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateGroupModal;
