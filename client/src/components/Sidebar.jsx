import React from 'react'
import { assets, dummyUserData } from '../assets/assets'
import { Link, useNavigate } from 'react-router-dom'
import MenuItems from './MenuItems'
import { CirclePlus, LogOut } from 'lucide-react'
import {UserButton, useClerk} from '@clerk/clerk-react'
import { useSelector } from 'react-redux';

const Sidebar = ({sidebarOpen, setSidebarOpen}) => {

    const navigate = useNavigate()
    const user = useSelector((state) => state.user.value)
    const {signOut} = useClerk()

  return (
    <div className={`w-64 xl:w-80 bg-white border-r border-gray-100 flex flex-col justify-between items-center max-sm:absolute top-0 bottom-0 z-20 shadow-sm ${sidebarOpen ? 'translate-x-0' : 'max-sm:-translate-x-full'} transition-all duration-300 ease-in-out`}>
      <div className='w-full'>
            <div className='flex items-center justify-center py-6'>
              <img onClick={()=> navigate('/')} src={assets.logo} className='h-12 cursor-pointer hover:scale-105 transition-transform' alt="Trendly" />
            </div>
            <hr className='border-gray-100 mb-6'/>

            <MenuItems setSidebarOpen={setSidebarOpen}/>

            <Link to='/create-post' className='flex items-center justify-center gap-3 py-3 mt-8 mx-6 rounded-2xl bg-green-500 hover:bg-green-600 active:scale-95 transition-all duration-200 text-white font-medium shadow-lg hover:shadow-xl'>
                <CirclePlus className='w-5 h-5'/>
                Create Post
            </Link>
      </div>

        <div className='w-full border-t border-gray-100 p-6 flex items-center justify-between'>
            <div className='flex gap-3 items-center cursor-pointer hover:bg-gray-50 rounded-xl p-2 transition-colors flex-1'>
                <UserButton />
                <div className='flex-1'>
                    <h1 className='text-sm font-semibold text-gray-900'>{user.full_name}</h1>
                    <p className='text-xs text-gray-500'>@{user.username}</p>
                </div>
            </div>
            <LogOut onClick={signOut} className='w-5 h-5 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer p-1 hover:bg-gray-100 rounded-lg'/>
        </div>

    </div>
  )
}

export default Sidebar
