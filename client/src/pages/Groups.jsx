import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '@clerk/clerk-react';
import { Link, useNavigate } from 'react-router-dom';
import { 
    Plus, 
    Search, 
    Users, 
    Settings, 
    Eye,
    Crown,
    Shield,
    Globe,
    Lock,
    EyeOff
} from 'lucide-react';
import { getUserGroups, discoverGroups } from '../features/groups/groupsSlice';
import Loading from '../components/Loading';
import CreateGroupModal from '../components/CreateGroupModal';
import GroupCard from '../components/GroupCard';

const Groups = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { getToken } = useAuth();
    
    const { 
        userGroups, 
        discoveredGroups, 
        loading, 
        error,
        pagination 
    } = useSelector(state => state.groups);
    
    const [activeTab, setActiveTab] = useState('my-groups');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [groupFilter, setGroupFilter] = useState('all');

    // Load user's groups on component mount
    useEffect(() => {
        const loadUserGroups = async () => {
            try {
                const token = await getToken();
                dispatch(getUserGroups({ page: 1, limit: 20, filter: groupFilter, token }));
            } catch (error) {
                console.error('Error loading user groups:', error);
            }
        };

        loadUserGroups();
    }, [dispatch, getToken, groupFilter]);

    // Load discovered groups when switching to discover tab
    useEffect(() => {
        if (activeTab === 'discover') {
            const loadDiscoveredGroups = async () => {
                try {
                    const token = await getToken();
                    dispatch(discoverGroups({ 
                        search: searchTerm, 
                        category: selectedCategory, 
                        page: 1, 
                        limit: 20, 
                        token 
                    }));
                } catch (error) {
                    console.error('Error loading discovered groups:', error);
                }
            };

            loadDiscoveredGroups();
        }
    }, [activeTab, searchTerm, selectedCategory, dispatch, getToken]);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (activeTab === 'discover') {
            try {
                const token = await getToken();
                dispatch(discoverGroups({ 
                    search: searchTerm, 
                    category: selectedCategory, 
                    page: 1, 
                    limit: 20, 
                    token 
                }));
            } catch (error) {
                console.error('Error searching groups:', error);
            }
        }
    };

    const getPrivacyIcon = (privacy) => {
        switch (privacy) {
            case 'public':
                return <Globe className="w-4 h-4" />;
            case 'private':
                return <Lock className="w-4 h-4" />;
            case 'secret':
                return <EyeOff className="w-4 h-4" />;
            default:
                return <Globe className="w-4 h-4" />;
        }
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case 'admin':
                return <Crown className="w-4 h-4 text-yellow-500" />;
            case 'moderator':
                return <Shield className="w-4 h-4 text-blue-500" />;
            default:
                return null;
        }
    };

    const categories = [
        { value: '', label: 'All Categories' },
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

    if (loading && userGroups.length === 0 && discoveredGroups.length === 0) {
        return <Loading />;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto p-6">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Groups</h1>
                            <p className="text-gray-600">Connect with like-minded people and communities</p>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            Create Group
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-4 border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('my-groups')}
                            className={`pb-3 px-1 border-b-2 transition-colors ${
                                activeTab === 'my-groups'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            My Groups ({userGroups.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('discover')}
                            className={`pb-3 px-1 border-b-2 transition-colors ${
                                activeTab === 'discover'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Discover Groups
                        </button>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                    <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder={activeTab === 'my-groups' ? 'Search your groups...' : 'Search groups...'}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {activeTab === 'discover' && (
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {categories.map(category => (
                                    <option key={category.value} value={category.value}>
                                        {category.label}
                                    </option>
                                ))}
                            </select>
                        )}

                        {activeTab === 'my-groups' && (
                            <select
                                value={groupFilter}
                                onChange={(e) => setGroupFilter(e.target.value)}
                                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Groups</option>
                                <option value="created">Created by Me</option>
                                <option value="admin">Admin Role</option>
                            </select>
                        )}

                        <button
                            type="submit"
                            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            Search
                        </button>
                    </form>
                </div>

                {/* Groups Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeTab === 'my-groups' ? (
                        userGroups.length === 0 ? (
                            <div className="col-span-full text-center py-12">
                                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-xl font-medium text-gray-900 mb-2">No groups yet</h3>
                                <p className="text-gray-500 mb-4">
                                    Create your first group or discover existing ones to get started
                                </p>
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                    Create Group
                                </button>
                            </div>
                        ) : (
                            userGroups.map(group => (
                                <GroupCard 
                                    key={group._id} 
                                    group={group} 
                                    showRole={true}
                                    onGroupClick={() => navigate(`/groups/${group._id}`)}
                                />
                            ))
                        )
                    ) : (
                        discoveredGroups.length === 0 ? (
                            <div className="col-span-full text-center py-12">
                                <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-xl font-medium text-gray-900 mb-2">No groups found</h3>
                                <p className="text-gray-500">
                                    Try adjusting your search terms or category filters
                                </p>
                            </div>
                        ) : (
                            discoveredGroups.map(group => (
                                <GroupCard 
                                    key={group._id} 
                                    group={group} 
                                    showJoinButton={true}
                                    onGroupClick={() => navigate(`/groups/${group._id}`)}
                                />
                            ))
                        )
                    )}
                </div>

                {/* Load More Button */}
                {((activeTab === 'my-groups' && pagination.userGroups.currentPage < pagination.userGroups.totalPages) ||
                  (activeTab === 'discover' && pagination.discoveredGroups.currentPage < pagination.discoveredGroups.totalPages)) && (
                    <div className="text-center mt-8">
                        <button
                            onClick={async () => {
                                const token = await getToken();
                                const currentPagination = activeTab === 'my-groups' 
                                    ? pagination.userGroups 
                                    : pagination.discoveredGroups;
                                
                                if (activeTab === 'my-groups') {
                                    dispatch(getUserGroups({ 
                                        page: currentPagination.currentPage + 1, 
                                        limit: 20, 
                                        filter: groupFilter, 
                                        token 
                                    }));
                                } else {
                                    dispatch(discoverGroups({ 
                                        search: searchTerm, 
                                        category: selectedCategory, 
                                        page: currentPagination.currentPage + 1, 
                                        limit: 20, 
                                        token 
                                    }));
                                }
                            }}
                            disabled={loading}
                            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? 'Loading...' : 'Load More'}
                        </button>
                    </div>
                )}
            </div>

            {/* Create Group Modal */}
            {showCreateModal && (
                <CreateGroupModal 
                    onClose={() => setShowCreateModal(false)}
                    onGroupCreated={(group) => {
                        setShowCreateModal(false);
                        navigate(`/groups/${group._id}`);
                    }}
                />
            )}
        </div>
    );
};

export default Groups;
