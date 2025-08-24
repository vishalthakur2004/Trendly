import React, { useEffect, useState } from 'react'
import { assets, dummyPostsData } from '../assets/assets'
import Loading from '../components/Loading'
import StoriesBar from '../components/StoriesBar'
import PostCard from '../components/PostCard'
import RecentMessages from '../components/RecentMessages'
import { useAuth } from '@clerk/clerk-react'
import { Home } from 'lucide-react'
import api from '../api/axios'
import toast from 'react-hot-toast'

const Feed = () => {

  const [feeds, setFeeds] = useState([])
  const [loading, setLoading] = useState(true)
  const {getToken} = useAuth()


  const fetchFeeds = async () => {
    try {
      setLoading(true)
      const {data} = await api.get('/api/post/feed', {headers: { Authorization: `Bearer ${await getToken()}` }})

      if (data.success){
        setFeeds(data.posts)
      }else{
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
    setLoading(false)
  }

  useEffect(()=>{
    fetchFeeds()
  },[])

  return !loading ? (
    <div className='h-full overflow-y-auto scroll-smooth bg-gray-50'>
      {/* Responsive Grid Layout */}
      <div className='min-h-screen'>
        <div className='max-w-7xl mx-auto px-0 sm:px-4 lg:px-6 xl:px-8'>
          <div className='grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-0 lg:gap-6'>

            {/* Main Feed - Takes full width on mobile, 2/3 on large screens, 1/2 on xl */}
            <div className='col-span-1 lg:col-span-2 xl:col-span-2'>
              <div className='max-w-lg mx-auto lg:max-w-none'>

                {/* Stories Bar */}
                <div className='bg-white border-b border-gray-200 lg:border-none lg:bg-transparent lg:pt-6 lg:mb-6 sticky top-0 z-10 lg:static lg:z-auto'>
                  <StoriesBar />
                </div>

                {/* Posts Feed */}
                <div className='space-y-0 lg:space-y-8 pb-20 lg:pb-8'>
                  {feeds.length > 0 ? (
                    feeds.map((post, index) => (
                      <div
                        key={post._id}
                        className={`bg-white lg:rounded-xl lg:shadow-sm border-b border-gray-200 lg:border-none transition-all duration-300 hover:lg:shadow-md ${
                          index === 0 ? 'lg:mt-0' : ''
                        }`}
                      >
                        <PostCard post={post} />
                      </div>
                    ))
                  ) : (
                    <div className='flex flex-col items-center justify-center py-20 px-6 bg-white lg:rounded-xl lg:shadow-sm lg:border border-gray-200'>
                      <div className='w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-6'>
                        <Home className='w-12 h-12 text-gray-500' />
                      </div>
                      <h2 className='text-xl font-bold text-gray-900 mb-3'>Welcome to your feed!</h2>
                      <p className='text-gray-600 text-center text-base max-w-md leading-relaxed'>
                        Follow people to see their posts in your feed, or create your first post to get started and connect with others.
                      </p>
                      <div className='mt-6 space-x-3'>
                        <button className='px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors'>
                          Create Post
                        </button>
                        <button className='px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors'>
                          Discover People
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Sidebar - Hidden on mobile, shows on large screens */}
            <div className='hidden lg:block col-span-1 xl:col-span-2'>
              <div className='sticky top-6 space-y-6'>

                {/* Recent Messages - Larger screens */}
                <div className='xl:max-w-sm'>
                  <RecentMessages />
                </div>

                {/* Additional sidebar content for larger screens */}
                <div className='hidden xl:block xl:max-w-sm'>
                  <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-4'>
                    <h3 className='font-semibold text-gray-900 mb-3'>Suggestions for you</h3>
                    <p className='text-sm text-gray-600'>Discover new people and communities to follow.</p>
                    <button className='mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium'>
                      See all suggestions
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : <Loading />
}

export default Feed
