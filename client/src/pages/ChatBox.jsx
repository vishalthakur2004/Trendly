import React, { useEffect, useRef, useState } from 'react'
import { ImageIcon, SendHorizonal, Phone, Video, ArrowLeft, MoreVertical, Smile } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import api from '../api/axios'
import { addMessage, fetchMessages, resetMessages } from '../features/messages/messagesSlice'
import { initiateCall, setCallInitiating } from '../features/calls/callsSlice'
import toast from 'react-hot-toast'
import socketService from '../services/socketService'
import moment from 'moment'

const ChatBox = () => {
  const { messages } = useSelector((state) => state.messages)
  const connections = useSelector((state) => state.connections.connections)
  const currentUser = useSelector((state) => state.user.value)
  const { userId } = useParams()
  const { getToken } = useAuth()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [text, setText] = useState('')
  const [image, setImage] = useState(null)
  const [user, setUser] = useState(null)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)

  const fetchUserMessages = async () => {
    try {
      const token = await getToken()
      dispatch(fetchMessages({ token, userId }))
    } catch (error) {
      toast.error(error.message)
    }
  }

  const sendMessage = async () => {
    try {
      if (!text && !image) return

      const token = await getToken()
      const formData = new FormData()
      formData.append('to_user_id', userId)
      formData.append('text', text)
      image && formData.append('image', image)

      const { data } = await api.post('/api/message/send', formData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (data.success) {
        setText('')
        setImage(null)
        dispatch(addMessage(data.message))
      } else {
        throw new Error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleStartCall = async (callType) => {
    try {
      const token = await getToken()

      dispatch(setCallInitiating(true))

      const result = await dispatch(initiateCall({
        recipientId: userId,
        callType,
        isGroupCall: false,
        token
      })).unwrap()

      socketService.initiateCall({
        callId: result.call_id,
        recipientId: userId,
        callType,
        initiatorData: currentUser
      })

      toast.success(`${callType} call initiated`)

    } catch (error) {
      console.error('Error starting call:', error)
      toast.error(`Failed to start ${callType} call`)
      dispatch(setCallInitiating(false))
    }
  }

  const formatTime = (date) => {
    const messageDate = moment(date)
    const now = moment()
    
    if (now.diff(messageDate, 'days') === 0) {
      return messageDate.format('HH:mm')
    } else if (now.diff(messageDate, 'days') === 1) {
      return 'Yesterday'
    } else if (now.diff(messageDate, 'days') < 7) {
      return messageDate.format('dddd')
    } else {
      return messageDate.format('MMM DD')
    }
  }

  const groupMessagesByDate = (messages) => {
    const groups = []
    let currentGroup = null
    
    messages.forEach((message) => {
      const messageDate = moment(message.createdAt).format('YYYY-MM-DD')
      
      if (!currentGroup || currentGroup.date !== messageDate) {
        currentGroup = {
          date: messageDate,
          displayDate: moment(message.createdAt).calendar(null, {
            sameDay: '[Today]',
            lastDay: '[Yesterday]',
            lastWeek: 'dddd',
            sameElse: 'MMMM DD, YYYY'
          }),
          messages: []
        }
        groups.push(currentGroup)
      }
      
      currentGroup.messages.push(message)
    })
    
    return groups
  }

  useEffect(() => {
    fetchUserMessages()

    return () => {
      dispatch(resetMessages())
    }
  }, [userId])

  useEffect(() => {
    if (connections.length > 0) {
      const user = connections.find(connection => connection._id === userId)
      setUser(user)
    }
  }, [connections, userId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sortedMessages = messages.toSorted((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
  const messageGroups = groupMessagesByDate(sortedMessages)

  return user && (
    <div className='flex flex-col h-screen bg-white'>
      {/* Header */}
      <div className='flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white'>
        <div className='flex items-center space-x-3'>
          <button
            onClick={() => navigate('/messages')}
            className='p-2 hover:bg-gray-100 rounded-full transition-colors md:hidden'
          >
            <ArrowLeft className='w-5 h-5' />
          </button>
          
          <div className='relative'>
            <img src={user.profile_picture} alt="" className="w-10 h-10 rounded-full object-cover" />
            <div className='absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full'></div>
          </div>
          
          <div className='flex-1'>
            <h2 className="font-semibold text-gray-900">{user.full_name}</h2>
            <p className="text-sm text-gray-500">@{user.username}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleStartCall('voice')}
            className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
            title="Voice Call"
          >
            <Phone className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleStartCall('video')}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
            title="Video Call"
          >
            <Video className="w-5 h-5" />
          </button>
          <button
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
            title="More Options"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className='flex-1 overflow-y-auto px-4 py-4 bg-gray-50'>
        <div className='max-w-4xl mx-auto space-y-4'>
          {messageGroups.map((group, groupIndex) => (
            <div key={groupIndex}>
              {/* Date Separator */}
              <div className='flex justify-center mb-4'>
                <span className='px-3 py-1 text-xs text-gray-500 bg-white rounded-full shadow-sm border'>
                  {group.displayDate}
                </span>
              </div>

              {/* Messages */}
              {group.messages.map((message, index) => {
                const isFromCurrentUser = message.from_user_id === currentUser?._id
                const showAvatar = !isFromCurrentUser
                
                return (
                  <div key={index} className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'} mb-2`}>
                    {showAvatar && (
                      <img 
                        src={user.profile_picture} 
                        alt="" 
                        className="w-6 h-6 rounded-full mr-2 mt-auto"
                      />
                    )}
                    
                    <div className={`flex flex-col max-w-xs lg:max-w-md ${isFromCurrentUser ? 'items-end' : 'items-start'}`}>
                      <div className={`px-4 py-2 rounded-2xl ${
                        isFromCurrentUser 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-white text-gray-900 border border-gray-200'
                      }`}>
                        {message.message_type === 'image' && (
                          <img 
                            src={message.media_url} 
                            className='w-full max-w-sm rounded-lg mb-2' 
                            alt="" 
                          />
                        )}
                        {message.text && (
                          <p className='text-sm leading-relaxed break-words'>{message.text}</p>
                        )}
                      </div>
                      
                      <span className='text-xs text-gray-500 mt-1 px-2'>
                        {formatTime(message.createdAt)}
                        {isFromCurrentUser && message.seen && (
                          <span className='ml-1 text-blue-600'>• Seen</span>
                        )}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className='border-t border-gray-200 bg-white px-4 py-3'>
        <div className='max-w-4xl mx-auto'>
          <div className='flex items-end space-x-3'>
            {/* Image Preview */}
            {image && (
              <div className='relative'>
                <img src={URL.createObjectURL(image)} alt="" className='w-12 h-12 rounded-lg object-cover' />
                <button
                  onClick={() => setImage(null)}
                  className='absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs'
                >
                  ×
                </button>
              </div>
            )}

            {/* Input Container */}
            <div className='flex-1 flex items-center space-x-2 bg-gray-100 rounded-full px-4 py-2'>
              <label htmlFor="image" className='cursor-pointer'>
                <ImageIcon className='w-5 h-5 text-gray-500 hover:text-gray-700' />
                <input 
                  type="file" 
                  id='image' 
                  accept="image/*" 
                  hidden 
                  onChange={(e) => setImage(e.target.files[0])} 
                />
              </label>

              <input
                type="text"
                className='flex-1 bg-transparent outline-none text-gray-900 placeholder-gray-500'
                placeholder='Message...'
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                onChange={(e) => setText(e.target.value)}
                value={text}
              />

              <button className='text-gray-500 hover:text-gray-700'>
                <Smile className='w-5 h-5' />
              </button>
            </div>

            {/* Send Button */}
            <button
              onClick={sendMessage}
              disabled={!text && !image}
              className={`p-2 rounded-full transition-colors ${
                text || image
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <SendHorizonal size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatBox
