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
    <div className='h-full overflow-y-scroll no-scrollbar bg-gray-50'>
      {/* Main Feed Container - Instagram Style */}
      <div className='max-w-lg mx-auto bg-white md:bg-gray-50'>

        {/* Stories Bar */}
        <div className='bg-white border-b border-gray-200 md:border-none md:bg-transparent md:pt-6'>
          <StoriesBar />
        </div>

        {/* Posts Feed */}
        <div className='space-y-0 md:space-y-6 md:pt-6 pb-20 md:pb-6'>
          {feeds.map((post)=>(
            <div key={post._id} className='bg-white md:rounded-xl md:shadow-sm border-b border-gray-200 md:border-none'>
              <PostCard post={post}/>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop Right Sidebar */}
      <div className='hidden xl:block fixed top-20 right-8 w-80'>
        <div className='space-y-6'>
          <div className='bg-white text-xs p-4 rounded-xl shadow-sm border border-gray-200'>
            <h3 className='text-gray-800 font-semibold mb-3'>Sponsored</h3>
            <img src={assets.sponsored_img} className='w-full h-32 object-cover rounded-lg mb-3' alt="" />
            <p className='text-gray-600 font-medium mb-1'>Email marketing</p>
            <p className='text-gray-400 text-xs leading-relaxed'>Supercharge your marketing with a powerful, easy-to-use platform built for results.</p>
          </div>
          <RecentMessages />
        </div>
      </div>
    </div>
  ) : <Loading />
}

export default Feed
