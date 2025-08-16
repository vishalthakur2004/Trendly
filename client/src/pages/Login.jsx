import React from 'react'
import { assets } from '../assets/assets'
import { Star, TrendingUp } from 'lucide-react'
import {SignIn} from '@clerk/clerk-react'

const Login = () => {
  return (
    <div className='min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-purple-50 via-white to-orange-50'>
      {/* left side : Branding  */}
      <div className='flex-1 flex flex-col items-start justify-between p-6 md:p-12 lg:pl-20'>
        <img src={assets.logo} alt="Trendly" className='h-16 object-contain'/>
        <div className='max-w-lg'>
            <div className='flex items-center gap-4 mb-8 max-md:mt-12'>
                <div className='flex items-center gap-2'>
                  <TrendingUp className='w-8 h-8 text-green-500'/>
                  <div className='w-12 h-12 bg-gradient-to-br from-purple-500 to-orange-500 rounded-xl flex items-center justify-center'>
                    <span className='text-white font-bold text-lg'>T</span>
                  </div>
                </div>
                <div>
                    <div className='flex mb-1'>
                        {Array(5).fill(0).map((_, i)=>(<Star key={i} className='size-5 text-transparent fill-amber-500'/>))}
                    </div>
                    <p className='text-gray-600 font-medium'>Trusted by 50k+ users</p>
                </div>
            </div>
            <h1 className='text-4xl md:text-7xl font-bold mb-6'>
              <span className='bg-gradient-to-r from-purple-600 to-orange-500 bg-clip-text text-transparent'>
                Stay Trending
              </span>
              <br />
              <span className='text-gray-900'>Connect & Create</span>
            </h1>
            <p className='text-xl md:text-2xl text-gray-700 leading-relaxed max-w-lg'>
              Join the most vibrant social platform where trends are born and connections flourish.
            </p>
        </div>
        <div className='flex items-center gap-4 text-sm text-gray-500'>
          <span>🔒 Secure</span>
          <span>🌐 Global</span>
          <span>⚡ Fast</span>
          <span>🎨 Creative</span>
        </div>
      </div>
      {/* Right side: Login Form */}
      <div className='flex-1 flex items-center justify-center p-6 sm:p-12 bg-white/50 backdrop-blur-sm'>
        <div className='w-full max-w-md'>
          <div className='text-center mb-8'>
            <h2 className='text-2xl font-bold text-gray-900 mb-2'>Welcome to Trendly</h2>
            <p className='text-gray-600'>Sign in to join the conversation</p>
          </div>
          <SignIn />
        </div>
      </div>
    </div>
  )
}

export default Login
