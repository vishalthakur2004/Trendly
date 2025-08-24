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
    <div className='bg-white p-4 sm:p-6 lg:p-8'>
      <div className='flex flex-col sm:flex-row items-start gap-6 sm:gap-8'>

        {/* Profile Picture */}
        <div className='flex-shrink-0 mx-auto sm:mx-0'>
            <img
                src={user.profile_picture}
                alt={user.full_name}
                className='w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 rounded-full object-cover border border-gray-200'
            />
        </div>

        <div className='flex-1 w-full text-center sm:text-left'>
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                <div className='flex-1'>
                    <div className='flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4'>
                        <h1 className='text-xl sm:text-2xl font-light text-gray-900'>{user.username || user.full_name}</h1>

                        {/* Action Buttons */}
                        <div className='flex items-center gap-2'>
                            {/* if user is not on others profile that means he is opening his profile so we will give edit button */}
                            {!profileId ? (
                                <button
                                    onClick={()=> setShowEdit(true)}
                                    className='px-4 py-1.5 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors'
                                >
                                    Edit profile
                                </button>
                            ) : (
                                /* Show call buttons and message button when viewing another user's profile */
                                <>
                                    <button
                                        onClick={() => navigate(`/messages/${user._id}`)}
                                        className='px-4 py-1.5 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600 transition-colors'
                                    >
                                        Message
                                    </button>
                                    {isConnection && (
                                        <>
                                            <button
                                                onClick={() => handleStartCall('voice')}
                                                className='p-1.5 text-gray-700 hover:bg-gray-100 rounded-md transition-colors'
                                                title="Voice Call"
                                            >
                                                <Phone className="w-4 h-4"/>
                                            </button>
                                            <button
                                                onClick={() => handleStartCall('video')}
                                                className='p-1.5 text-gray-700 hover:bg-gray-100 rounded-md transition-colors'
                                                title="Video Call"
                                            >
                                                <Video className="w-4 h-4"/>
                                            </button>
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className='flex items-center justify-center sm:justify-start gap-8 mb-4'>
                        <div className='text-center sm:text-left'>
                            <span className='font-semibold text-gray-900'>{posts.length}</span>
                            <span className='text-gray-700 ml-1'>posts</span>
                        </div>
                        <div className='text-center sm:text-left'>
                            <span className='font-semibold text-gray-900'>{user.followers.length}</span>
                            <span className='text-gray-700 ml-1'>followers</span>
                        </div>
                        <div className='text-center sm:text-left'>
                            <span className='font-semibold text-gray-900'>{user.following.length}</span>
                            <span className='text-gray-700 ml-1'>following</span>
                        </div>
                    </div>

                    {/* Full Name and Bio */}
                    <div className='text-left'>
                        <div className='font-semibold text-gray-900 mb-1'>{user.full_name}</div>
                        {user.bio && (
                            <div className='text-gray-700 text-sm whitespace-pre-line'>{user.bio}</div>
                        )}
                        {user.location && (
                            <div className='flex items-center gap-1 text-gray-500 text-sm mt-2'>
                                <MapPin className='w-4 h-4'/>
                                {user.location}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>

      </div>
    </div>
  )
}

export default UserProfileInfo
