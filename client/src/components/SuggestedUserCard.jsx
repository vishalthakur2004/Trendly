import React from 'react'
import { MapPin, MessageCircle, Plus, UserPlus, Users } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { useAuth } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { fetchUser } from '../features/user/userSlice'

const SuggestedUserCard = ({ user }) => {
    const currentUser = useSelector((state) => state.user.value)
    const { getToken } = useAuth()
    const dispatch = useDispatch()
    const navigate = useNavigate()

    const handleFollow = async () => {
        try {
            const { data } = await api.post('/api/user/follow', { id: user._id }, {
                headers: { Authorization: `Bearer ${await getToken()}` }
            })
            if (data.success) {
                toast.success(data.message)
                dispatch(fetchUser(await getToken()))
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const handleConnectionRequest = async () => {
        if (currentUser.connections.includes(user._id)) {
            return navigate('/messages/' + user._id)
        }

        try {
            const { data } = await api.post('/api/user/connect', { id: user._id }, {
                headers: { Authorization: `Bearer ${await getToken()}` }
            })
            if (data.success) {
                toast.success(data.message)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const handleViewProfile = () => {
        navigate(`/profile/${user._id}`)
    }

    return (
        <div className='p-6 flex flex-col justify-between w-80 shadow-lg border border-gray-200 rounded-xl bg-white hover:shadow-xl transition-shadow duration-300'>
            {/* Header with mutual connections badge */}
            {user.mutualConnectionsCount > 0 && (
                <div className='flex justify-end mb-2'>
                    <div className='bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1'>
                        <Users className='w-3 h-3' />
                        {user.mutualConnectionsCount} mutual
                    </div>
                </div>
            )}

            {/* User Info */}
            <div className='text-center'>
                <div className='relative inline-block'>
                    <img 
                        src={user.profile_picture} 
                        alt={user.full_name} 
                        className='rounded-full w-20 h-20 shadow-md mx-auto object-cover cursor-pointer hover:opacity-90 transition-opacity'
                        onClick={handleViewProfile}
                    />
                </div>
                <h3 className='mt-4 font-semibold text-lg text-gray-900'>{user.full_name}</h3>
                {user.username && <p className='text-gray-500 font-light'>@{user.username}</p>}
                {user.bio && (
                    <p className='text-gray-600 mt-3 text-center text-sm px-2 line-clamp-3'>
                        {user.bio}
                    </p>
                )}
            </div>

            {/* Mutual Connections */}
            {user.mutualConnections && user.mutualConnections.length > 0 && (
                <div className='mt-4 p-3 bg-gray-50 rounded-lg'>
                    <p className='text-xs text-gray-600 mb-2 font-medium'>Mutual connections:</p>
                    <div className='flex items-center gap-1 flex-wrap'>
                        {user.mutualConnections.slice(0, 3).map((connection, index) => (
                            <span key={connection._id} className='text-xs text-blue-600 font-medium'>
                                {connection.full_name}
                                {index < user.mutualConnections.length - 1 && index < 2 ? ', ' : ''}
                            </span>
                        ))}
                        {user.mutualConnectionsCount > 3 && (
                            <span className='text-xs text-gray-500'>
                                and {user.mutualConnectionsCount - 3} more
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Stats */}
            <div className='flex items-center justify-center gap-3 mt-4 text-xs text-gray-600'>
                {user.location && (
                    <div className='flex items-center gap-1 border border-gray-300 rounded-full px-3 py-1.5'>
                        <MapPin className='w-3 h-3' />
                        <span className='truncate max-w-20'>{user.location}</span>
                    </div>
                )}
                <div className='flex items-center gap-1 border border-gray-300 rounded-full px-3 py-1.5'>
                    <Users className='w-3 h-3' />
                    <span>{user.followers?.length || 0} followers</span>
                </div>
            </div>

            {/* Action Buttons */}
            <div className='flex mt-6 gap-2'>
                {/* Follow Button */}
                <button 
                    onClick={handleFollow} 
                    disabled={currentUser?.following.includes(user._id)} 
                    className={`flex-1 py-2.5 rounded-lg flex justify-center items-center gap-2 font-medium transition-all duration-200 ${
                        currentUser?.following.includes(user._id)
                            ? 'bg-gray-100 text-gray-600 cursor-default'
                            : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale-95 text-white cursor-pointer hover:shadow-lg'
                    }`}
                >
                    <UserPlus className='w-4 h-4' />
                    {currentUser?.following.includes(user._id) ? 'Following' : 'Follow'}
                </button>

                {/* Connection Request / Message Button */}
                <button 
                    onClick={handleConnectionRequest} 
                    className='flex items-center justify-center w-12 h-10 border-2 border-gray-300 text-gray-600 hover:border-indigo-500 hover:text-indigo-600 rounded-lg cursor-pointer active:scale-95 transition-all duration-200 hover:shadow-md'
                    title={currentUser?.connections.includes(user._id) ? 'Send Message' : 'Send Connection Request'}
                >
                    {currentUser?.connections.includes(user._id) ? (
                        <MessageCircle className='w-5 h-5' />
                    ) : (
                        <Plus className='w-5 h-5' />
                    )}
                </button>
            </div>

            {/* View Profile Button */}
            <button 
                onClick={handleViewProfile}
                className='mt-3 w-full py-2 text-sm text-gray-600 hover:text-indigo-600 transition-colors duration-200 font-medium'
            >
                View Profile
            </button>
        </div>
    )
}

export default SuggestedUserCard
