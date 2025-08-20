import { Calendar, MapPin, PenBox, Verified, Phone, Video, MessageSquare } from 'lucide-react'
import moment from 'moment'
import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useAuth } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import { initiateCall, setCallInitiating } from '../features/calls/callsSlice'
import socketService from '../services/socketService'
import toast from 'react-hot-toast'

const UserProfileInfo = ({user, posts, profileId, setShowEdit}) => {
  const dispatch = useDispatch()
  const { getToken } = useAuth()
  const navigate = useNavigate()
  const currentUser = useSelector((state) => state.user.value)
  const { connections } = useSelector((state) => state.connections)

  // Check if this user is in connections
  const isConnection = connections.some(conn => conn._id === user._id)

  const handleStartCall = async (callType) => {
    try {
      const token = await getToken()

      dispatch(setCallInitiating(true))

      // Initiate call in database
      const result = await dispatch(initiateCall({
        recipientId: user._id,
        callType,
        isGroupCall: false,
        token
      })).unwrap()

      // Send call signal via socket
      socketService.initiateCall({
        callId: result.call_id,
        recipientId: user._id,
        callType,
        initiatorData: currentUser
      })

      toast.success(`${callType} call initiated with ${user.full_name}`)

    } catch (error) {
      console.error('Error starting call:', error)
      toast.error(`Failed to start ${callType} call`)
      dispatch(setCallInitiating(false))
    }
  }
  return (
    <div className='relative py-4 px-6 md:px-8 bg-white'>
      <div className='flex flex-col md:flex-row items-start gap-6'>

        <div className='w-32 h-32 border-4 border-white shadow-lg absolute -top-16 rounded-full'>
            <img src={user.profile_picture} alt="" className='absolute rounded-full z-2'/>
        </div>

        <div className='w-full pt-16 md:pt-0 md:pl-36'>
            <div className='flex flex-col md:flex-row items-start justify-between'>
                <div>
                    <div className='flex items-center gap-3'>
                        <h1 className='text-2xl font-bold text-gray-900'>{user.full_name}</h1>
                        <Verified className='w-6 h-6 text-blue-500'/>
                    </div>
                    <p className='text-gray-600'>{user.username ? `@${user.username}` : 'Add a username'}</p>
                </div>
                {/* if user is not on others profile that means he is opening his profile so we will give edit button */}
                {!profileId ? (
                    <button onClick={()=> setShowEdit(true)} className='flex items-center gap-2 border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium transition-colors mt-4 md:mt-0 cursor-pointer'>
                        <PenBox className='"w-4 h-4'/>
                        Edit
                    </button>
                ) : (
                    /* Show call buttons and message button when viewing another user's profile */
                    <div className='flex items-center gap-2 mt-4 md:mt-0'>
                        <button
                            onClick={() => navigate(`/messages/${user._id}`)}
                            className='flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer'
                            title="Send Message"
                        >
                            <MessageSquare className="w-4 h-4"/>
                            Message
                        </button>

                        {isConnection && (
                            <>
                                <button
                                    onClick={() => handleStartCall('voice')}
                                    className='flex items-center justify-center w-10 h-10 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors cursor-pointer'
                                    title="Voice Call"
                                >
                                    <Phone className="w-4 h-4"/>
                                </button>

                                <button
                                    onClick={() => handleStartCall('video')}
                                    className='flex items-center justify-center w-10 h-10 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer'
                                    title="Video Call"
                                >
                                    <Video className="w-4 h-4"/>
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
            <p className='text-gray-700 text-sm max-w-md mt-4'>{user.bio}</p>

            <div className='flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500 mt-4'>
                <span className='flex items-center gap-1.5'>
                    <MapPin className='w-4 h-4'/>
                    {user.location ? user.location : 'Add location'}
                </span>
                <span className='flex items-center gap-1.5'>
                    <Calendar className='w-4 h-4'/>
                    Joined <span className='font-medium'>{moment(user.createdAt).fromNow()}</span>
                </span>
            </div>

            <div className='flex items-center gap-6 mt-6 border-t border-gray-200 pt-4'>
                <div>
                    <span className='sm:text-xl font-bold text-gray-900'>{posts.length}</span>
                    <span className='text-xs sm:text-sm text-gray-500 ml-1.5'>Posts</span>
                </div>
                <div>
                    <span className='sm:text-xl font-bold text-gray-900'>
                        {user.followers.length}</span>
                    <span className='text-xs sm:text-sm text-gray-500 ml-1.5'>Followers</span>
                </div>
                <div>
                    <span className='sm:text-xl font-bold text-gray-900'>
                        {user.following.length}</span>
                    <span className='text-xs sm:text-sm text-gray-500 ml-1.5'>Following</span>
                </div>
            </div>
        </div>

      </div>
    </div>
  )
}

export default UserProfileInfo
