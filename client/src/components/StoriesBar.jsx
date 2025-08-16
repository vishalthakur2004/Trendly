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
    const [viewStory, setViewStory] = useState(null)

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

  return (
    <div className='w-full max-w-2xl no-scrollbar overflow-x-auto px-4'>

        <div className='flex gap-4 pb-6'>
            {/* Add Story Card */}
            <div onClick={()=>setShowModal(true)} className='rounded-2xl shadow-sm min-w-32 max-w-32 h-48 aspect-[2/3] cursor-pointer hover:shadow-md transition-all duration-200 border-2 border-dashed border-green-300 bg-gradient-to-b from-green-50 to-white'>
                <div className='h-full flex flex-col items-center justify-center p-4'>
                    <div className='size-12 bg-green-500 rounded-full flex items-center justify-center mb-3 shadow-lg'>
                        <Plus className='w-6 h-6 text-white'/>
                    </div>
                    <p className='text-sm font-semibold text-gray-700 text-center'>Create Story</p>
                </div>
            </div>
            {/* Story Cards */}
            {
                stories.map((story, index)=> (
                    <div onClick={()=> setViewStory(story)} key={index} className={`relative rounded-2xl shadow-sm min-w-32 max-w-32 h-48 cursor-pointer hover:shadow-lg transition-all duration-200 bg-gradient-to-b from-purple-500 to-orange-500 hover:from-purple-600 hover:to-orange-600 active:scale-95 overflow-hidden`}>
                        <img src={story.user.profile_picture} alt="" className='absolute size-10 top-4 left-4 z-10 rounded-full ring-2 ring-white shadow-lg'/>
                        <p className='absolute top-20 left-4 text-white/80 text-sm truncate max-w-24 font-medium'>{story.content}</p>
                        <p className='text-white/90 absolute bottom-3 right-3 z-10 text-xs font-medium bg-black/20 px-2 py-1 rounded-full'>{moment(story.createdAt).fromNow()}</p>
                        {
                            story.media_type !== 'text' && (
                                <div className='absolute inset-0 z-1 rounded-2xl bg-black overflow-hidden'>
                                    {
                                        story.media_type === "image" ?
                                        <img src={story.media_url} alt="" className='h-full w-full object-cover hover:scale-110 transition duration-500 opacity-80 hover:opacity-90'/>
                                        :
                                        <video src={story.media_url} className='h-full w-full object-cover hover:scale-110 transition duration-500 opacity-80 hover:opacity-90'/>
                                    }
                                </div>
                            )
                        }

                    </div>
                ))
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
