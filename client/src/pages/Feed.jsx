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
    <div className='h-full overflow-y-auto bg-gray-50 lg:bg-white instagram-scroll feed-container'>
      {/* Instagram-style Layout */}
      <div className='min-h-screen bg-gray-50 lg:bg-white'>
        <div className='max-w-6xl mx-auto'>
          <div className='flex justify-center'>

            {/* Main Feed - Instagram Style */}
            <div className='w-full max-w-lg lg:max-w-xl xl:max-w-2xl'>

              {/* Stories Bar - Sticky on mobile */}
              <div className='bg-white border-b border-gray-200 sticky top-0 z-20 lg:relative lg:border-0 lg:bg-transparent lg:pt-6'>
                <StoriesBar />
              </div>

              {/* Posts Feed */}
              <div className='pb-20 lg:pb-8'>
                {feeds.length > 0 ? (
                  feeds.map((post, index) => (
                    <div
                      key={post._id}
                      className={`bg-white border-b border-gray-200 lg:border lg:rounded-lg lg:shadow-sm lg:mb-6 ${
                        index === 0 ? 'lg:mt-6' : ''
                      }`}
                    >
                      <PostCard post={post} />
                    </div>
                  ))
                ) : (
                  <div className='flex flex-col items-center justify-center py-24 px-4 bg-white lg:rounded-lg lg:shadow-sm lg:mt-6'>
                    <div className='w-24 h-24 border-2 border-gray-300 rounded-full flex items-center justify-center mb-6'>
                      <Home className='w-12 h-12 text-gray-400' />
                    </div>
                    <h2 className='text-xl font-semibold text-gray-900 mb-3'>Welcome to your feed!</h2>
                    <p className='text-gray-600 text-center text-sm max-w-sm leading-relaxed'>
                      Follow people to see their posts here, or create your first post to get started.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Sidebar - Desktop Only */}
            <div className='hidden xl:block w-80 ml-8'>
              <div className='sticky top-8 pt-6'>

                {/* Recent Messages */}
                <div className='mb-6'>
                  <RecentMessages />
                </div>

                {/* Suggestions */}
                <div className='bg-white rounded-lg border border-gray-200 p-4'>
                  <div className='flex items-center justify-between mb-4'>
                    <h3 className='font-semibold text-gray-900'>Suggestions for you</h3>
                    <button className='text-sm text-blue-600 hover:text-blue-700 font-medium'>
                      See All
                    </button>
                  </div>
                  <p className='text-sm text-gray-600 mb-4'>
                    Discover new people and communities to follow.
                  </p>

                  {/* Sample suggestion items */}
                  <div className='space-y-3'>
                    {[1, 2, 3].map((item) => (
                      <div key={item} className='flex items-center justify-between'>
                        <div className='flex items-center gap-3'>
                          <div className='w-8 h-8 bg-gray-200 rounded-full'></div>
                          <div>
                            <div className='text-sm font-medium text-gray-900'>username{item}</div>
                            <div className='text-xs text-gray-500'>Suggested for you</div>
                          </div>
                        </div>
                        <button className='text-xs text-blue-600 font-medium hover:text-blue-700'>
                          Follow
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer links */}
                <div className='mt-6 text-xs text-gray-400 space-y-1'>
                  <div className='flex flex-wrap gap-2'>
                    <span>About</span>
                    <span>Help</span>
                    <span>Press</span>
                    <span>API</span>
                    <span>Jobs</span>
                    <span>Privacy</span>
                    <span>Terms</span>
                  </div>
                  <div>© 2024 PingUp</div>
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
