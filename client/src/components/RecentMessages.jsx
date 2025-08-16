import React, { useEffect, useState } from 'react'
import { dummyRecentMessagesData } from '../assets/assets'
import { Link } from 'react-router-dom'
import moment from 'moment'
import { useAuth, useUser } from '@clerk/clerk-react'
import api from '../api/axios'
import toast from 'react-hot-toast'

const RecentMessages = () => {

    const [messages, setMessages] = useState([])
    const {user} = useUser()
    const {getToken} = useAuth()

    const fetchRecentMessages = async () => {
        try {
          const token = await getToken()
            const { data } = await api.get('/api/user/recent-messages', {
                headers: { Authorization: `Bearer ${token}` }
            })
            if(data.success){
                // Group messages by sender and get the latest message for each sender
                const groupedMessages = data.messages.reduce((acc, message)=>{
                    const senderId = message.from_user_id._id;
                    if(!acc[senderId] || new Date(message.createdAt) > new Date(acc[senderId].createdAt)){
                        acc[senderId] = message
                    }
                    return acc;
                }, {})

                // Sort messages by date
                const sortedMessages = Object.values(groupedMessages).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

                setMessages(sortedMessages)
            }else{
                toast.error(data.message)
            }
        } catch (error) {
             toast.error(error.message)
        }
    }

    useEffect(()=>{
        if(user){
            fetchRecentMessages()
            setInterval(fetchRecentMessages, 30000)
            return ()=> {clearInterval()}
        }
        
    },[user])

  return (
    <div className='bg-white w-80 p-6 rounded-2xl shadow-sm border border-gray-100'>
      <h3 className='font-semibold text-gray-900 mb-6 text-lg'>Recent Messages</h3>
      <div className='flex flex-col max-h-72 overflow-y-scroll no-scrollbar space-y-2'>
        {
            messages.map((message, index)=>(
                <Link to={`/messages/${message.from_user_id._id}`} key={index} className='flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors'>
                    <img src={message.from_user_id.profile_picture} alt="" className='w-12 h-12 rounded-full ring-2 ring-gray-100'/>
                    <div className='w-full'>
                        <div className='flex justify-between items-center mb-1'>
                            <p className='font-semibold text-gray-900 text-sm'>{message.from_user_id.full_name}</p>
                            <p className='text-xs text-gray-500'>{moment(message.createdAt).fromNow()}</p>
                        </div>
                        <div className='flex justify-between items-center'>
                            <p className='text-gray-600 text-sm truncate max-w-48'>{message.text ? message.text : 'Media'}</p>
                            {!message.seen && <div className='bg-green-500 text-white w-5 h-5 flex items-center justify-center rounded-full text-xs font-medium'>1</div>}
                        </div>
                    </div>

                </Link>
            ))
        }
      </div>
    </div>
  )
}

export default RecentMessages
