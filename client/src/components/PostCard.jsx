import React, { useState, useEffect } from 'react'
import { BadgeCheck, Heart, MessageCircle, Share2 } from 'lucide-react'
import moment from 'moment'
import { dummyUserData } from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux';
import { useAuth } from '@clerk/clerk-react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import LikesModal from './LikesModal'

const PostCard = ({post}) => {

    const postWithHashtags = post.content.replace(/(#\w+)/g, '<span class="text-green-600 font-medium">$1</span>')
    const [likes, setLikes] = useState(post.likes_count)
    const [likedUsers, setLikedUsers] = useState([])
    const [showLikesModal, setShowLikesModal] = useState(false)
    const currentUser = useSelector((state) => state.user.value)
    const connections = useSelector((state) => state.connections.connections)

    const { getToken } = useAuth()

    // Fetch user details for likes
    const fetchLikedUsers = async () => {
        if (likes.length === 0) return

        try {
            const token = await getToken()
            const { data } = await api.post('/api/user/get-users-by-ids',
                { userIds: likes },
                { headers: { Authorization: `Bearer ${token}` }}
            )

            if (data.success) {
                setLikedUsers(data.users)
            }
        } catch (error) {
            // If API doesn't exist, create mock data for demonstration
            const mockUsers = likes.map(id => ({
                _id: id,
                full_name: id === currentUser._id ? currentUser.full_name : `User ${id.slice(-4)}`,
                username: id === currentUser._id ? currentUser.username : `user_${id.slice(-4)}`,
                profile_picture: id === currentUser._id ? currentUser.profile_picture : `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face`
            }))
            setLikedUsers(mockUsers)
        }
    }

    useEffect(() => {
        fetchLikedUsers()
    }, [likes])

    const handleLike = async () => {
        try {
            const { data } = await api.post(`/api/post/like`, {postId: post._id}, {headers: { Authorization: `Bearer ${await getToken()}` }})

            if (data.success){
               toast.success(data.message)
               setLikes(prev =>{
                if(prev.includes(currentUser._id)){
                    return prev.filter(id=> id !== currentUser._id)
                }else{
                    return [...prev, currentUser._id]
                }
               })
            }else{
                toast(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    // Instagram-style likes display
    const renderLikesDisplay = () => {
        if (likes.length === 0) return null

        const connectionIds = connections.map(conn => conn._id)
        const likedConnections = likedUsers.filter(user =>
            connectionIds.includes(user._id) || user._id === currentUser._id
        )

        const totalLikes = likes.length
        const connectionsCount = likedConnections.length
        const othersCount = totalLikes - connectionsCount

        if (totalLikes === 0) return null

        if (totalLikes === 1) {
            const user = likedUsers[0]
            return (
                <div className="text-sm text-gray-900">
                    <span className="font-medium">
                        {user?._id === currentUser._id ? 'You' : user?.full_name || 'Someone'}
                    </span>
                    <span className="text-gray-600"> liked this</span>
                </div>
            )
        }

        if (connectionsCount === 0) {
            return (
                <div className="text-sm text-gray-900">
                    <span className="font-medium">{totalLikes} likes</span>
                </div>
            )
        }

        let displayText = "Liked by "

        if (connectionsCount === 1) {
            const user = likedConnections[0]
            displayText += `${user._id === currentUser._id ? 'you' : user.username}`
        } else if (connectionsCount === 2) {
            const [first, second] = likedConnections
            const firstName = first._id === currentUser._id ? 'you' : first.username
            const secondName = second._id === currentUser._id ? 'you' : second.username
            displayText += `${firstName} and ${secondName}`
        } else {
            const first = likedConnections[0]
            const firstName = first._id === currentUser._id ? 'you' : first.username
            displayText += `${firstName} and ${connectionsCount - 1} others`
        }

        if (othersCount > 0) {
            displayText += ` and ${othersCount} other${othersCount > 1 ? 's' : ''}`
        }

        return (
            <div className="text-sm">
                <span className="text-gray-900">{displayText}</span>
            </div>
        )
    }

    const navigate = useNavigate()

  return (
    <div className='bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5 w-full max-w-2xl hover:shadow-md transition-shadow'>
        {/* User Info */}
        <div onClick={()=> navigate('/profile/' + post.user._id)} className='inline-flex items-center gap-4 cursor-pointer hover:bg-gray-50 p-2 rounded-xl transition-colors -m-2'>
            <img src={post.user.profile_picture} alt="" className='w-12 h-12 rounded-full ring-2 ring-gray-100'/>
            <div>
                <div className='flex items-center space-x-2'>
                    <span className='font-semibold text-gray-900'>{post.user.full_name}</span>
                    {post.user.is_verified && <BadgeCheck className='w-5 h-5 text-green-500'/>}
                </div>
                <div className='text-gray-500 text-sm'>@{post.user.username} • {moment(post.createdAt).fromNow()}</div>
            </div>
        </div>
         {/* Content */}
         {post.content && <div className='text-gray-800 text-base leading-relaxed whitespace-pre-line' dangerouslySetInnerHTML={{__html: postWithHashtags}}/>}

       {/* Images */}
       <div className='grid grid-cols-2 gap-3'>
            {post.image_urls.map((img, index)=>(
                <img src={img} key={index} className={`w-full h-52 object-cover rounded-xl ${post.image_urls.length === 1 && 'col-span-2 h-80'}`} alt="" />
            ))}
       </div>

        {/* Actions */}
        <div className='flex items-center gap-6 text-gray-600'>
            <div className='flex items-center gap-2 hover:bg-red-50 p-2 rounded-xl transition-colors cursor-pointer group' onClick={handleLike}>
                <Heart className={`w-5 h-5 group-hover:text-red-500 transition-colors ${likes.includes(currentUser._id) && 'text-red-500 fill-red-500'}`}/>
            </div>
            <div className='flex items-center gap-2 hover:bg-blue-50 p-2 rounded-xl transition-colors cursor-pointer group'>
                <MessageCircle className="w-5 h-5 group-hover:text-blue-500 transition-colors"/>
            </div>
            <div className='flex items-center gap-2 hover:bg-green-50 p-2 rounded-xl transition-colors cursor-pointer group'>
                <Share2 className="w-5 h-5 group-hover:text-green-500 transition-colors"/>
            </div>
        </div>

        {/* Instagram-style Likes Display */}
        {likes.length > 0 && (
            <div className='flex items-center gap-3'>
                {/* Profile pictures of recent likers */}
                <div className='flex -space-x-2'>
                    {likedUsers.slice(0, 3).map((user, index) => (
                        <img
                            key={user._id}
                            src={user.profile_picture}
                            alt={user.full_name}
                            className='w-6 h-6 rounded-full ring-2 ring-white border border-gray-200'
                            title={user.full_name}
                        />
                    ))}
                </div>
                {/* Likes text */}
                <div className='flex-1'>
                    {renderLikesDisplay()}
                </div>
            </div>
        )}

        {/* Comments Preview */}
        <div className='flex items-center gap-4 text-gray-500 text-sm pt-2 border-t border-gray-100'>
            <span className='cursor-pointer hover:text-gray-700'>View all 12 comments</span>
            <span>•</span>
            <span>7 shares</span>
        </div>
    </div>
  )
}

export default PostCard
