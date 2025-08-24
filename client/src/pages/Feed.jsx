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
                    <div className='flex flex-col items-center justify-center py-16 px-4 bg-white lg:rounded-xl lg:shadow-sm'>
                      <div className='w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4'>
                        <Home className='w-10 h-10 text-gray-400' />
                      </div>
                      <h2 className='text-lg font-semibold text-gray-900 mb-2'>No posts yet</h2>
                      <p className='text-gray-600 text-center text-sm max-w-sm'>
                        Follow people to see their posts in your feed, or create your first post to get started.
                      </p>
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
