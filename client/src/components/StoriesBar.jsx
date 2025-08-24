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
    <div className='w-full max-w-lg mx-auto lg:max-w-none bg-white lg:bg-transparent p-4 lg:px-0 border-b border-gray-200 lg:border-none'>
        <div className='flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar pb-2 px-1'>
            {/* Add Story Card - Your Story */}
            <div
                onClick={()=>setShowModal(true)}
                className='flex-shrink-0 w-16 flex flex-col items-center cursor-pointer group'
            >
                <div className='relative'>
                    <div className='w-14 h-14 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center border-2 border-gray-200 group-hover:border-gray-300 transition-colors'>
                        <Plus className='w-6 h-6 text-gray-600'/>
                    </div>
                </div>
                <span className='text-xs text-gray-900 mt-1 text-center truncate w-full'>Your Story</span>
            </div>

            {/* Story Cards - Grouped by User - Instagram Style */}
            {
                userStoryGroups.map((userGroup, index) => {
                    const latestStory = userGroup.latestStory
                    const storyCount = userGroup.stories.length

                    return (
                        <div
                            onClick={() => handleStoryClick(userGroup)}
                            key={index}
                            className='flex-shrink-0 w-16 flex flex-col items-center cursor-pointer group'
                        >
                            <div className='relative'>
                                {/* Story Ring - Instagram gradient */}
                                <div className='w-16 h-16 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 p-0.5'>
                                    <div className='w-full h-full rounded-full bg-white p-0.5'>
                                        <img
                                            src={latestStory.user.profile_picture}
                                            alt={latestStory.user.full_name}
                                            className='w-full h-full rounded-full object-cover'
                                        />
                                    </div>
                                </div>

                                {/* Story Count Badge */}
                                {storyCount > 1 && (
                                    <div className='absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center border-2 border-white'>
                                        {storyCount}
                                    </div>
                                )}
                            </div>

                            {/* Username */}
                            <span className='text-xs text-gray-900 mt-1 text-center truncate w-full px-1'>
                                {latestStory.user.username}
                            </span>
                        </div>
                    )
                })
            }
        </div>

        {/* Add Story Modal */}
        {showModal && <StoryModal setShowModal={setShowModal} fetchStories={fetchStories}/>}

        {/* View Story Modal */}
        {viewerData && (
            <StoryViewer
                stories={viewerData.stories}
                initialStoryIndex={viewerData.initialStoryIndex}
                onClose={() => setViewerData(null)}
            />
        )}
      
    </div>
  )
}

export default StoriesBar
