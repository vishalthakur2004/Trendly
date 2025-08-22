import React from 'react'
import { dummyUserData } from '../assets/assets'
import { MapPin, MessageCircle, Plus, UserPlus } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { useAuth } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { fetchUser } from '../features/user/userSlice'
import Avatar from './Avatar'

const UserCard = ({user}) => {

    const currentUser = useSelector((state) => state.user.value)
    const {getToken} = useAuth()
    const dispatch = useDispatch()
    const navigate = useNavigate()

    const handleFollow = async () => {
        try {
            const { data } = await api.post('/api/user/follow', {id: user._id}, {
                headers: { Authorization: `Bearer ${await getToken()}` }
            })
            if (data.success) {
                toast.success(data.message)
                dispatch(fetchUser(await getToken()))
            }else{
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const handleConnectionRequest = async () => {
        if(currentUser.connections.includes(user._id)){
            return navigate('/messages/' + user._id)
        }

        try {
            const { data } = await api.post('/api/user/connect', {id: user._id}, {
                headers: { Authorization: `Bearer ${await getToken()}` }
            })
            if (data.success) {
                toast.success(data.message)
            }else{
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

  return (
    <div key={user._id} className='p-6 flex flex-col justify-between w-72 shadow-lg border border-gray-100 rounded-xl bg-white hover:shadow-xl transition-all duration-300'>
        <div className='text-center'>
            <Avatar
                src={user.profile_picture}
                name={user.full_name}
                size="lg"
                onClick={() => navigate('/profile/' + user._id)}
                className="mx-auto"
            />
            <h3 className='mt-4 font-semibold text-lg text-gray-900'>{user.full_name}</h3>
            {user.username && <p className='text-gray-500 font-medium text-sm'>@{user.username}</p>}
            {user.bio && <p className='text-gray-600 mt-3 text-center text-sm px-2 line-clamp-2 leading-relaxed'>{user.bio}</p>}
        </div>

        <div className='flex items-center justify-center gap-3 mt-5 text-xs text-gray-600'>
            {user.location && (
                <div className='flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-full px-3 py-2'>
                    <MapPin className='w-3 h-3 text-gray-500'/>
                    <span className='font-medium'>{user.location}</span>
                </div>
            )}
            <div className='flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-full px-3 py-2'>
                <span className='font-semibold text-gray-700'>{user.followers?.length || 0}</span>
                <span>followers</span>
            </div>
        </div>

        <div className='flex mt-6 gap-3'>
            {/* Follow Button */}
            <button
                onClick={handleFollow}
                disabled={currentUser?.following.includes(user._id)}
                className={`flex-1 py-2.5 rounded-xl flex justify-center items-center gap-2 font-medium transition-all duration-200 ${
                    currentUser?.following.includes(user._id)
                        ? 'bg-gray-100 text-gray-600 cursor-default'
                        : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale-95 text-white cursor-pointer hover:shadow-lg transform'
                }`}
            >
                <UserPlus className='w-4 h-4'/>
                {currentUser?.following.includes(user._id) ? 'Following' : 'Follow'}
            </button>
            {/* Connection Request Button / Message Button */}
            <button
                onClick={handleConnectionRequest}
                className='flex items-center justify-center w-12 h-10 border-2 border-gray-200 text-gray-600 hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl cursor-pointer active:scale-95 transition-all duration-200 transform hover:shadow-md'
                title={currentUser?.connections.includes(user._id) ? 'Send Message' : 'Send Connection Request'}
            >
                {
                    currentUser?.connections.includes(user._id) ?
                    <MessageCircle className='w-5 h-5'/>
                    :
                    <Plus className='w-5 h-5'/>
                }
            </button>
        </div>
    </div>
  )
}

export default UserCard
