import React, { useEffect, useState } from 'react'
import { dummyStoriesData } from '../assets/assets'
import { Plus } from 'lucide-react'
import moment from 'moment'
import StoryModal from './StoryModal'
import StoryViewer from './StoryViewer'
import { useAuth } from '@clerk/clerk-react'
import api from '../api/axios'
import toast from 'react-hot-toast'

const StoriesBar = () => {

    const {getToken} = useAuth()

    const [stories, setStories] = useState([])
    const [showModal, setShowModal] = useState(false)
    const [viewerData, setViewerData] = useState(null)

    const fetchStories = async () => {
        try {
            const token = await getToken()
            const { data } = await api.get('/api/story/get', {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (data.success){
                setStories(data.stories)
            }else{
                toast(data.message)
            }

        } catch (error) {
            toast.error(error.message)
        }
    }

    useEffect(()=>{
        fetchStories()
    },[])

    // Group stories by user (like Instagram)
    const groupedStories = stories.reduce((groups, story) => {
        const userId = story.user._id
        if (!groups[userId]) {
            groups[userId] = {
                user: story.user,
                stories: [story],
                latestStory: story
            }
        } else {
            groups[userId].stories.push(story)
            // Keep the latest story as the preview
            if (new Date(story.createdAt) > new Date(groups[userId].latestStory.createdAt)) {
                groups[userId].latestStory = story
            }
        }
        return groups
    }, {})

    const userStoryGroups = Object.values(groupedStories)

    const handleStoryClick = (userGroup) => {
        // Find the index of the first story from this user in the full stories array
        const firstStoryIndex = stories.findIndex(story => story.user._id === userGroup.user._id)
        setViewerData({
            stories: stories,
            initialStoryIndex: firstStoryIndex
        })
    }

  return (
    <div className='w-screen sm:w-[calc(100vw-240px)] lg:max-w-2xl no-scrollbar overflow-x-auto px-4'>

        <div className='flex gap-4 pb-5'>
            {/* Add Story Card */}
            <div onClick={()=>setShowModal(true)} className='rounded-lg shadow-sm min-w-30 max-w-30 max-h-40 aspect-[3/4] cursor-pointer hover:shadow-lg transition-all duration-200 border-2 border-dashed border-indigo-300 bg-gradient-to-b from-indigo-50 to-white'>
                <div className='h-full flex flex-col items-center justify-center p-4'>
                    <div className='size-10 bg-indigo-500 rounded-full flex items-center justify-center mb-3'>
                        <Plus className='w-5 h-5 text-white'/>
                    </div>
                    <p className='text-sm font-medium text-slate-700 text-center'>Create Story</p>
                </div>
            </div>
            {/* Story Cards - Grouped by User */}
            {
                userStoryGroups.map((userGroup, index) => {
                    const latestStory = userGroup.latestStory
                    const storyCount = userGroup.stories.length

                    return (
                        <div onClick={() => handleStoryClick(userGroup)} key={index} className={`relative rounded-lg shadow min-w-30 max-w-30 max-h-40 cursor-pointer hover:shadow-lg transition-all duration-200 bg-gradient-to-b from-indigo-500 to-purple-600 hover:from-indigo-700 hover:to-purple-800 active:scale-95`}>
                            {/* User Avatar with Story Ring */}
                            <img
                                src={latestStory.user.profile_picture}
                                alt=""
                                className='absolute size-8 top-3 left-3 z-10 rounded-full ring-2 ring-white shadow'
                            />

                            {/* Story Count Badge */}
                            {storyCount > 1 && (
                                <div className='absolute top-2 right-2 z-10 bg-black bg-opacity-60 text-white text-xs px-1.5 py-0.5 rounded-full'>
                                    {storyCount}
                                </div>
                            )}

                            {/* Content Preview */}
                            <p className='absolute top-18 left-3 text-white/60 text-sm truncate max-w-24'>
                                {latestStory.content || userGroup.user.full_name}
                            </p>

                            {/* Time */}
                            <p className='text-white absolute bottom-1 right-2 z-10 text-xs'>
                                {moment(latestStory.createdAt).fromNow()}
                            </p>

                            {/* Media Background */}
                            {
                                latestStory.media_type !== 'text' && (
                                    <div className='absolute inset-0 z-1 rounded-lg bg-black overflow-hidden'>
                                        {
                                            latestStory.media_type === "image" ?
                                            <img src={latestStory.media_url} alt="" className='h-full w-full object-cover hover:scale-110 transition duration-500 opacity-70 hover:opacity-80'/>
                                            :
                                            <video src={latestStory.media_url} className='h-full w-full object-cover hover:scale-110 transition duration-500 opacity-70 hover:opacity-80' muted/>
                                        }
                                    </div>
                                )
                            }
                        </div>
                    )
                })
            }
        </div>

        {/* Add Story Modal */}
        {showModal && <StoryModal setShowModal={setShowModal} fetchStories={fetchStories}/>}
        {/* View Story Modal */}
        {viewStory && <StoryViewer viewStory={viewStory} setViewStory={setViewStory}/>}
      
    </div>
  )
}

export default StoriesBar
