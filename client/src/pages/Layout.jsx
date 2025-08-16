import React, { useState } from 'react'
import Sidebar from '../components/Sidebar'
import { Outlet } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { dummyUserData } from '../assets/assets'
import Loading from '../components/Loading'
import { useSelector } from 'react-redux'

const Layout = () => {

    const user = useSelector((state)=>state.user.value)
    const [sidebarOpen, setSidebarOpen] = useState(false)

  return user ? (
    <div className='w-full flex h-screen bg-gray-50'>

        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}/>

        <div className='flex-1 bg-gray-50 overflow-hidden'>
            <Outlet />
        </div>
      {
        sidebarOpen ?
        <X className='absolute top-4 right-4 p-2 z-50 bg-white rounded-xl shadow-lg w-11 h-11 text-gray-600 sm:hidden cursor-pointer hover:bg-gray-50 transition-colors' onClick={()=> setSidebarOpen(false)}/>
        :
        <Menu className='absolute top-4 right-4 p-2 z-50 bg-white rounded-xl shadow-lg w-11 h-11 text-gray-600 sm:hidden cursor-pointer hover:bg-gray-50 transition-colors' onClick={()=> setSidebarOpen(true)}/>
      }
    </div>
  ) : (
    <Loading />
  )
}

export default Layout
