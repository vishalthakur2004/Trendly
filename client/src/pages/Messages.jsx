import React, { useState, useEffect } from 'react'
import { MessageSquare, Phone, Video, Search, MoreHorizontal } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useAuth } from '@clerk/clerk-react'
import { initiateCall, setCallInitiating } from '../features/calls/callsSlice'
import toast from 'react-hot-toast'
import socketService from '../services/socketService'
import api from '../api/axios'
import moment from 'moment'

const Messages = () => {
  const { connections } = useSelector((state) => state.connections)
  const currentUser = useSelector((state) => state.user.value)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { getToken } = useAuth()

  const [searchQuery, setSearchQuery] = useState('')
  const [recentMessages, setRecentMessages] = useState([])
  const [filteredConnections, setFilteredConnections] = useState([])

  const fetchRecentMessages = async () => {
    try {
      const token = await getToken()
      const { data } = await api.get('/api/user/recent-messages', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (data.success) {
        const groupedMessages = data.messages.reduce((acc, message) => {
          const senderId = message.from_user_id._id
          if (!acc[senderId] || new Date(message.createdAt) > new Date(acc[senderId].createdAt)) {
            acc[senderId] = message
          }
          return acc
        }, {})
        setRecentMessages(Object.values(groupedMessages))
      }
    } catch (error) {
      console.error('Error fetching recent messages:', error)
    }
  }

  const handleStartCall = async (user, callType) => {
    try {
      const token = await getToken()

      dispatch(setCallInitiating(true))

      const result = await dispatch(initiateCall({
        recipientId: user._id,
        callType,
        isGroupCall: false,
        token
      })).unwrap()

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

  const getLastMessage = (userId) => {
    const lastMsg = recentMessages.find(msg => msg.from_user_id._id === userId)
    if (lastMsg) {
      return {
        text: lastMsg.text || 'Media',
        time: moment(lastMsg.createdAt).fromNow(),
        unread: !lastMsg.seen
      }
    }
    return { text: 'Start a conversation', time: '', unread: false }
  }

  useEffect(() => {
    fetchRecentMessages()
    const interval = setInterval(fetchRecentMessages, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const filtered = connections.filter(user =>
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredConnections(filtered)
  }, [connections, searchQuery])

  return (
    <div className='min-h-screen bg-white'>
      {/* Header */}
      <div className='sticky top-0 bg-white border-b border-gray-200 px-4 py-4 md:px-6'>
        <div className='max-w-4xl mx-auto'>
          <h1 className='text-2xl font-semibold text-gray-900 mb-4'>Messages</h1>
          
          {/* Search Bar */}
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
            <input
              type='text'
              placeholder='Search messages...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white'
            />
          </div>
        </div>
      </div>

      {/* Conversations List */}
      <div className='max-w-4xl mx-auto'>
        {filteredConnections.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-12 text-gray-500'>
            <MessageSquare className='w-16 h-16 mb-4 text-gray-300' />
            <p className='text-lg font-medium'>No conversations found</p>
            <p className='text-sm'>Start connecting with people to begin messaging</p>
          </div>
        ) : (
          <div className='divide-y divide-gray-100'>
            {filteredConnections.map((user) => {
              const lastMessage = getLastMessage(user._id)
              
              return (
                <div key={user._id} className='flex items-center px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer group'>
                  {/* User Avatar */}
                  <div className='relative flex-shrink-0 mr-3'>
                    <img
                      src={user.profile_picture}
                      alt={user.full_name}
                      className='w-14 h-14 rounded-full object-cover'
                    />
                    {/* Online Status Indicator */}
                    <div className='absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full'></div>
                  </div>

                  {/* Conversation Info */}
                  <div
                    className='flex-1 min-w-0'
                    onClick={() => navigate(`/messages/${user._id}`)}
                  >
                    <div className='flex items-center justify-between mb-1'>
                      <h3 className='text-sm font-semibold text-gray-900 truncate'>
                        {user.full_name}
                      </h3>
                      <span className='text-xs text-gray-500 flex-shrink-0'>
                        {lastMessage.time}
                      </span>
                    </div>
                    
                    <div className='flex items-center justify-between'>
                      <p className={`text-sm truncate max-w-xs ${lastMessage.unread ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
                        {lastMessage.text}
                      </p>
                      {lastMessage.unread && (
                        <div className='w-2 h-2 bg-blue-600 rounded-full flex-shrink-0'></div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className='ml-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity'>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleStartCall(user, 'voice')
                      }}
                      className='p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors'
                      title='Voice Call'
                    >
                      <Phone className='w-4 h-4' />
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleStartCall(user, 'video')
                      }}
                      className='p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors'
                      title='Video Call'
                    >
                      <Video className='w-4 h-4' />
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/profile/${user._id}`)
                      }}
                      className='p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors'
                      title='More Options'
                    >
                      <MoreHorizontal className='w-4 h-4' />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Messages
