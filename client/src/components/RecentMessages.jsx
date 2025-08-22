import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import moment from 'moment'
import { useAuth, useUser } from '@clerk/clerk-react'
import { MessageSquare, ChevronRight } from 'lucide-react'
import api from '../api/axios'
import toast from 'react-hot-toast'

const RecentMessages = () => {
  const [messages, setMessages] = useState([])
  const { user } = useUser()
  const { getToken } = useAuth()

  const fetchRecentMessages = async () => {
    try {
      const token = await getToken()
      const { data } = await api.get('/api/user/recent-messages', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (data.success) {
        // Group messages by sender and get the latest message for each sender
        const groupedMessages = data.messages.reduce((acc, message) => {
          const senderId = message.from_user_id._id
          if (!acc[senderId] || new Date(message.createdAt) > new Date(acc[senderId].createdAt)) {
            acc[senderId] = message
          }
          return acc
        }, {})

        // Sort messages by date and limit to 5 most recent
        const sortedMessages = Object.values(groupedMessages)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5)

        setMessages(sortedMessages)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(() => {
    if (user) {
      fetchRecentMessages()
      const interval = setInterval(fetchRecentMessages, 30000)
      return () => clearInterval(interval)
    }
  }, [user])

  if (messages.length === 0) {
    return (
      <div className='bg-white max-w-xs mt-4 p-6 rounded-xl shadow-sm border border-gray-100'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='font-semibold text-gray-900 text-sm'>Messages</h3>
          <MessageSquare className='w-4 h-4 text-gray-400' />
        </div>
        <div className='text-center py-4'>
          <MessageSquare className='w-8 h-8 text-gray-300 mx-auto mb-2' />
          <p className='text-xs text-gray-500'>No recent messages</p>
        </div>
      </div>
    )
  }

  return (
    <div className='bg-white max-w-xs mt-4 rounded-xl shadow-sm border border-gray-100 overflow-hidden'>
      {/* Header */}
      <div className='flex items-center justify-between p-4 pb-3 border-b border-gray-50'>
        <h3 className='font-semibold text-gray-900 text-sm'>Recent Messages</h3>
        <Link 
          to='/messages' 
          className='text-blue-600 hover:text-blue-700 transition-colors'
          title='View all messages'
        >
          <ChevronRight className='w-4 h-4' />
        </Link>
      </div>

      {/* Messages List */}
      <div className='divide-y divide-gray-50'>
        {messages.map((message, index) => (
          <Link
            to={`/messages/${message.from_user_id._id}`}
            key={index}
            className='flex items-center p-3 hover:bg-gray-50 transition-colors group'
          >
            {/* Avatar */}
            <div className='relative flex-shrink-0 mr-3'>
              <img
                src={message.from_user_id.profile_picture}
                alt={message.from_user_id.full_name}
                className='w-10 h-10 rounded-full object-cover'
              />
              {!message.seen && (
                <div className='absolute -top-1 -right-1 w-3 h-3 bg-blue-600 border-2 border-white rounded-full'></div>
              )}
            </div>

            {/* Message Content */}
            <div className='flex-1 min-w-0'>
              <div className='flex items-center justify-between mb-1'>
                <p className={`text-sm truncate ${!message.seen ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                  {message.from_user_id.full_name}
                </p>
                <span className='text-xs text-gray-500 flex-shrink-0 ml-2'>
                  {moment(message.createdAt).fromNow(true)}
                </span>
              </div>
              
              <p className={`text-xs truncate ${!message.seen ? 'text-gray-900' : 'text-gray-500'}`}>
                {message.message_type === 'image' ? '📷 Photo' : message.text || 'Media'}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* View All Messages Footer */}
      <div className='p-3 bg-gray-50'>
        <Link
          to='/messages'
          className='text-center block text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors'
        >
          View all messages
        </Link>
      </div>
    </div>
  )
}

export default RecentMessages
