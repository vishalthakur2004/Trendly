import React, { useState } from 'react'
import Sidebar from '../components/Sidebar'
import MobileBottomNav from '../components/MobileBottomNav'
import { Outlet, useLocation } from 'react-router-dom'
import { Menu, X, Search, Heart } from 'lucide-react'
import { assets } from '../assets/assets'
import Loading from '../components/Loading'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import Avatar from '../components/Avatar'
import { useClerk } from '@clerk/clerk-react'

const Layout = () => {

    const user = useSelector((state)=>state.user.value)
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const location = useLocation()
    const { signOut } = useClerk()

  return user ? (
    <div className='w-full flex h-screen bg-gray-50'>
        {/* Desktop Sidebar */}
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}/>

        {/* Main Content Area */}
        <div className='flex-1 flex flex-col'>
            {/* Mobile Header - Instagram Style */}
            <div className='md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40'>
                <Link to="/" className="flex items-center">
                    <img src={assets.logo} className='h-8' alt="PingUp" />
                </Link>

                <div className="flex items-center gap-4">
                    <Link to="/notifications" className="p-2">
                        <Heart className="w-6 h-6 text-gray-700" />
                    </Link>
                    <Link to="/messages" className="p-2">
                        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    </Link>
                </div>
            </div>

            {/* Content */}
            <div className='flex-1 overflow-hidden'>
                <Outlet />
            </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav />

        {/* Mobile Menu Toggle for Sidebar (only show on larger screens when needed) */}
        {
            sidebarOpen ?
            <X className='absolute top-3 right-3 p-2 z-50 bg-white rounded-md shadow w-10 h-10 text-gray-600 md:hidden' onClick={()=> setSidebarOpen(false)}/>
            :
            null
        }
    </div>
  ) : (
    <Loading />
  )
}

export default Layout
