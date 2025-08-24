import React, { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { dummyPostsData, dummyUserData } from '../assets/assets'
import { useEffect } from 'react'
import Loading from '../components/Loading'
import UserProfileInfo from '../components/UserProfileInfo'
import PostCard from '../components/PostCard'
import ProfilePostsGrid from '../components/ProfilePostsGrid'
import moment from 'moment'
import ProfileModal from '../components/ProfileModal'
import { useAuth } from '@clerk/clerk-react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { useSelector } from 'react-redux'
import { Grid3x3, List } from 'lucide-react'

const Profile = () => {

  const currentUser = useSelector((state) => state.user.value)

  const {getToken} = useAuth()
  const {profileId} = useParams()
  const [user, setUser] = useState(null)
  const [posts, setPosts] = useState([])
  const [showEdit, setShowEdit] = useState(false)
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'

  const fetchUser = async (profileId) => {
    const token = await getToken()
    try {
      const { data } = await api.post(`/api/user/profiles`, {profileId}, {
        headers: {Authorization: `Bearer ${token}`}
      })
      if(data.success){
        setUser(data.profile)
        setPosts(data.posts)
      }else{
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(()=>{
    if(profileId){
      fetchUser(profileId)
    }else{
      fetchUser(currentUser._id)
    }
  },[profileId, currentUser])

  return user ? (
    <div className='relative h-full overflow-y-scroll bg-gray-50 p-6'>
      <div className='max-w-3xl mx-auto'>
        {/* Profile Card */}
        <div className='bg-white rounded-2xl shadow overflow-hidden'>
          {/* Cover Photo */}
          <div className='h-40 md:h-56 bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200'>
            {user.cover_photo && <img src={user.cover_photo} alt='' className='w-full h-full object-cover'/>}
          </div>
          {/* User Info */}
          <UserProfileInfo user={user} posts={posts} profileId={profileId} setShowEdit={setShowEdit}/>
        </div>

        {/* Posts Section */}
        <div className='mt-6'>
          {/* View Toggle Tabs */}
          <div className='flex justify-center border-b border-gray-200 mb-6'>
            <div className='flex bg-gray-100 rounded-lg p-1'>
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Grid3x3 className='w-4 h-4' />
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className='w-4 h-4' />
                List
              </button>
            </div>
          </div>

          {/* Posts Count */}
          <div className='text-center mb-6'>
            <span className='text-gray-600 text-sm'>
              {posts.length} {posts.length === 1 ? 'post' : 'posts'}
            </span>
          </div>

          {/* Posts Display */}
          {posts.length > 0 ? (
            viewMode === 'grid' ? (
              <ProfilePostsGrid posts={posts} user={user} />
            ) : (
              <div className='max-w-lg mx-auto space-y-6'>
                {posts.map((post) => (
                  <PostCard key={post._id} post={post} />
                ))}
              </div>
            )
          ) : (
            <div className='text-center py-12'>
              <div className='w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                <Grid3x3 className='w-10 h-10 text-gray-400' />
              </div>
              <h3 className='text-lg font-medium text-gray-900 mb-2'>No Posts Yet</h3>
              <p className='text-gray-600 text-sm'>
                {profileId === currentUser._id || !profileId
                  ? "Share your first post to get started!"
                  : "This user hasn't shared any posts yet."}
              </p>
            </div>
          )}
        </div>
      </div>
      {/* Edit Profile Modal */}
      {showEdit && <ProfileModal setShowEdit={setShowEdit}/>}
    </div>
  ) : (<Loading />)
}

export default Profile
