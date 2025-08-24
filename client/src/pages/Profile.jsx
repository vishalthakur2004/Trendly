import React, { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { dummyPostsData, dummyUserData } from '../assets/assets'
import { useEffect } from 'react'
import Loading from '../components/Loading'
import UserProfileInfo from '../components/UserProfileInfo'
import ProfilePostsGrid from '../components/ProfilePostsGrid'
import moment from 'moment'
import ProfileModal from '../components/ProfileModal'
import { useAuth } from '@clerk/clerk-react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { useSelector } from 'react-redux'

const Profile = () => {

  const currentUser = useSelector((state) => state.user.value)

  const {getToken} = useAuth()
  const {profileId} = useParams()
  const [user, setUser] = useState(null)
  const [posts, setPosts] = useState([])
  const [showEdit, setShowEdit] = useState(false)

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
    <div className='relative h-full overflow-y-auto bg-white instagram-scroll'>
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Profile Header - Instagram Style */}
        <div className='border-b border-gray-200'>
          <UserProfileInfo user={user} posts={posts} profileId={profileId} setShowEdit={setShowEdit}/>
        </div>

        {/* Posts Grid - Instagram Style */}
        <div className='py-4 sm:py-6'>
          <ProfilePostsGrid posts={posts} />
        </div>
      </div>
      {/* Edit Profile Modal */}
      {showEdit && <ProfileModal setShowEdit={setShowEdit}/>}
    </div>
  ) : (<Loading />)
}

export default Profile
