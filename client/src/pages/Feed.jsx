import React, { useEffect, useState } from 'react'
import { assets, dummyPostsData } from '../assets/assets'
import Loading from '../components/Loading'
import StoriesBar from '../components/StoriesBar'
import PostCard from '../components/PostCard'
import RecentMessages from '../components/RecentMessages'
import { useAuth } from '@clerk/clerk-react'
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
    <div className='h-full overflow-y-scroll no-scrollbar py-6 xl:pr-6 flex items-start justify-center xl:gap-8 bg-gray-50'>
      {/* Stories and post list */}
      <div className='w-full max-w-2xl'>
        <StoriesBar />
        <div className='px-4 space-y-6 mt-6'>
          {feeds.map((post)=>(
            <PostCard key={post._id} post={post}/>
          ))}
        </div>
      </div>

      {/* Right Sidebar */}
      <div className='max-xl:hidden sticky top-6 w-80'>
        <div className='bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6'>
          <h3 className='text-gray-900 font-semibold mb-4 text-lg'>Trending</h3>
          <div className='space-y-4'>
            <div className='flex items-center gap-3'>
              <div className='w-12 h-12 bg-gradient-to-br from-purple-500 to-orange-500 rounded-xl flex items-center justify-center'>
                <span className='text-white font-bold'>#</span>
              </div>
              <div>
                <p className='font-medium text-gray-900'>#TechTrends</p>
                <p className='text-sm text-gray-500'>15.2K posts</p>
              </div>
            </div>
            <div className='flex items-center gap-3'>
              <div className='w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center'>
                <span className='text-white font-bold'>#</span>
              </div>
              <div>
                <p className='font-medium text-gray-900'>#Innovation</p>
                <p className='text-sm text-gray-500'>8.7K posts</p>
              </div>
            </div>
          </div>
        </div>
        <RecentMessages />
      </div>
    </div>
  ) : <Loading />
}

export default Feed
