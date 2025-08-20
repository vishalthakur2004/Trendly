import React from 'react'
import { Eye, MessageSquare, Phone, Video } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useAuth } from '@clerk/clerk-react'
import { initiateCall, setCallInitiating } from '../features/calls/callsSlice'
import toast from 'react-hot-toast'
import socketService from '../services/socketService'

const Messages = () => {

  const { connections } = useSelector((state)=>state.connections)
  const currentUser = useSelector((state) => state.user.value)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { getToken } = useAuth()

  const handleStartCall = async (user, callType) => {
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
    <div className='min-h-screen relative bg-slate-50'>
      <div className='max-w-6xl mx-auto p-6'>
        {/* Title */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-slate-900 mb-2'>Messages</h1>
          <p className='text-slate-600'>Talk to your friends and family</p>
        </div>

        {/* Connected Users */}
        <div className='flex flex-col gap-3'>
          {connections.map((user)=>(
            <div key={user._id} className='max-w-xl flex flex-warp gap-5 p-6 bg-white shadow rounded-md'>
              <img src={user.profile_picture} alt="" className='rounded-full size-12 mx-auto'/>
              <div className='flex-1'>
                <p className='font-medium text-slate-700'>{user.full_name}</p>
                <p className='text-slate-500'>@{user.username}</p>
                <p className='text-sm text-gray-600'>{user.bio}</p>
              </div>

              <div className='flex flex-col gap-2 mt-4'>

                <button onClick={()=> navigate(`/messages/${user._id}`)} className='size-10 flex items-center justify-center text-sm rounded bg-slate-100 hover:bg-slate-200 text-slate-800 active:scale-95 transition cursor-pointer gap-1' title="Message">
                  <MessageSquare className="w-4 h-4"/>
                </button>

                <button onClick={() => handleStartCall(user, 'voice')} className='size-10 flex items-center justify-center text-sm rounded bg-green-50 hover:bg-green-100 text-green-600 active:scale-95 transition cursor-pointer' title="Voice Call">
                  <Phone className="w-4 h-4"/>
                </button>

                <button onClick={() => handleStartCall(user, 'video')} className='size-10 flex items-center justify-center text-sm rounded bg-blue-50 hover:bg-blue-100 text-blue-600 active:scale-95 transition cursor-pointer' title="Video Call">
                  <Video className="w-4 h-4"/>
                </button>

                <button onClick={()=> navigate(`/profile/${user._id}`)} className='size-10 flex items-center justify-center text-sm rounded bg-slate-100 hover:bg-slate-200 text-slate-800 active:scale-95 transition cursor-pointer' title="View Profile">
                  <Eye className="w-4 h-4"/>
                </button>

              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Messages
