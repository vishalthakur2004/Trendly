import React, { useState, useEffect } from 'react'
import { BadgeCheck, Heart, MessageCircle, Share2 } from 'lucide-react'
import moment from 'moment'
import { dummyUserData } from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux';
import { useAuth } from '@clerk/clerk-react'
import api from '../api/axios'
import toast from 'react-hot-toast'

const PostCard = ({post}) => {

    const postWithHashtags = post.content.replace(/(#\w+)/g, '<span class="text-green-600 font-medium">$1</span>')
    const [likes, setLikes] = useState(post.likes_count)
    const [likedUsers, setLikedUsers] = useState([])
    const currentUser = useSelector((state) => state.user.value)
    const connections = useSelector((state) => state.connections.connections)

    const { getToken } = useAuth()

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
        <div className='flex items-center gap-6 text-gray-600 pt-3 border-t border-gray-100'>
            <div className='flex items-center gap-2 hover:bg-red-50 p-2 rounded-xl transition-colors cursor-pointer group' onClick={handleLike}>
                <Heart className={`w-5 h-5 group-hover:text-red-500 transition-colors ${likes.includes(currentUser._id) && 'text-red-500 fill-red-500'}`}/>
                <span className='font-medium'>{likes.length}</span>
            </div>
            <div className='flex items-center gap-2 hover:bg-blue-50 p-2 rounded-xl transition-colors cursor-pointer group'>
                <MessageCircle className="w-5 h-5 group-hover:text-blue-500 transition-colors"/>
                <span className='font-medium'>12</span>
            </div>
            <div className='flex items-center gap-2 hover:bg-green-50 p-2 rounded-xl transition-colors cursor-pointer group'>
                <Share2 className="w-5 h-5 group-hover:text-green-500 transition-colors"/>
                <span className='font-medium'>7</span>
            </div>
        </div>
    </div>
  )
}

export default PostCard
