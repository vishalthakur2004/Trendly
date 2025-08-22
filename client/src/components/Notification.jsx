import React from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import Avatar from './Avatar'

const Notification = ({t, message}) => {

const navigate = useNavigate()

  return (
    <div className={`max-w-md w-full bg-white shadow-lg rounded-xl flex border border-gray-100 hover:scale-105 hover:shadow-xl transition-all duration-200`}>
      <div className='flex-1 p-4'>
        <div className='flex items-start'>
            <Avatar
                src={message.from_user_id.profile_picture}
                name={message.from_user_id.full_name}
                size="md"
                className="flex-shrink-0"
            />
            <div className='ml-3 flex-1'>
                <p className="text-sm font-semibold text-gray-900">
                    {message.from_user_id.full_name} </p>
                <p className="text-sm text-gray-600 line-clamp-2">
                     {message.text} </p>
            </div>
        </div>
      </div>
      <div className='flex border-l border-gray-100'>
        <button onClick={()=>{
            navigate(`/messages/${message.from_user_id._id}`);
            toast.dismiss(t.id)
        }} className='p-4 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-semibold transition-colors'>
            Reply
        </button>
      </div>
    </div>
  )
}

export default Notification
