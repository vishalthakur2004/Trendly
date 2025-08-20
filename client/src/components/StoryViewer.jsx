import { BadgeCheck, X } from 'lucide-react'
import React, { useEffect, useState } from 'react'

const StoryViewer = ({viewStory, setViewStory}) => {

    const [progress, setProgress] = useState(0)

    useEffect(()=>{
        let timer, progressInterval;

        if(viewStory && viewStory.media_type !== 'video'){
            setProgress(0)

            const duration = 10000;
            const setTime = 100;
            let elapsed = 0;

           progressInterval = setInterval(() => {
                elapsed += setTime;
                setProgress((elapsed / duration) * 100);
            }, setTime);

             // Close story after duration(10sec)
             timer = setTimeout(()=>{
                setViewStory(null)
             }, duration)
        }

        return ()=>{
            clearTimeout(timer);
            clearInterval(progressInterval)
        }

    }, [viewStory, setViewStory])

    const handleClose = ()=>{
        setViewStory(null)
    }

    if(!viewStory) return null

    const renderContent = ()=>{
        // Check if this is a shared post story
        if (viewStory.shared_post) {
            return (
                <div className='w-full max-w-md mx-auto p-4'>
                    {/* User's story content */}
                    {viewStory.content && (
                        <div className='mb-4 p-3 bg-black bg-opacity-50 rounded-lg'>
                            <p className='text-white text-lg text-center'>{viewStory.content}</p>
                        </div>
                    )}

                    {/* Shared post card */}
                    <div className='bg-white rounded-lg p-4 shadow-lg'>
                        <div className='flex items-center gap-2 mb-3'>
                            <img
                                src={viewStory.shared_post.user.profile_picture}
                                alt={viewStory.shared_post.user.full_name}
                                className='w-8 h-8 rounded-full'
                            />
                            <div>
                                <p className='text-gray-900 font-medium text-sm'>{viewStory.shared_post.user.full_name}</p>
                                <p className='text-gray-500 text-xs'>@{viewStory.shared_post.user.username}</p>
                            </div>
                        </div>

                        {viewStory.shared_post.content && (
                            <p className='text-gray-800 text-sm mb-3'>{viewStory.shared_post.content}</p>
                        )}

                        {viewStory.shared_post.image_urls && viewStory.shared_post.image_urls.length > 0 && (
                            <div className='grid gap-2'>
                                {viewStory.shared_post.image_urls.slice(0, 2).map((img, index) => (
                                    <img
                                        key={index}
                                        src={img}
                                        alt=""
                                        className='w-full h-32 object-cover rounded'
                                    />
                                ))}
                                {viewStory.shared_post.image_urls.length > 2 && (
                                    <div className='text-center text-gray-500 text-xs'>
                                        +{viewStory.shared_post.image_urls.length - 2} more images
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        // Regular story content
        switch (viewStory.media_type) {
            case 'image':
                return (
                    <img src={viewStory.media_url} alt="" className='max-w-full max-h-screen object-contain'/>
                );
            case 'video':
                return (
                    <video onEnded={()=>setViewStory(null)} src={viewStory.media_url} className='max-h-screen' controls autoPlay/>
                );
            case 'text':
                return (
                    <div className='w-full h-full flex items-center justify-center p-8 text-white text-2xl text-center'>
                        {viewStory.content}
                    </div>
                );

            default:
                return null;
        }
    }

  return (
    <div className='fixed inset-0 h-screen bg-black bg-opacity-90 z-110 flex items-center justify-center' style={{backgroundColor: viewStory.media_type === 'text' ? viewStory.background_color : '#000000'}}>
      
      {/* Progress Bar */}
      <div className='absolute top-0 left-0 w-full h-1 bg-gray-700'>
        <div className='h-full bg-white transition-all duration-100 linear' style={{width: `${progress}%`}}>

        </div>
      </div>
      {/* User Info - Top Left */}
      <div className='absolute top-4 left-4 flex items-center space-x-3 p-2 px-4 sm:p-4 sm:px-8 backdrop-blur-2xl rounded bg-black/50'>
        <img src={viewStory.user?.profile_picture} alt="" className='ize-7 sm:size-8 rounded-full object-cover border border-white'/>
        <div className='text-white font-medium flex items-center gap-1.5'>
            <span>{viewStory.user?.full_name}</span>
            <BadgeCheck size={18}/>
        </div>
      </div>

       {/* Close Button */}
       <button onClick={handleClose} className='absolute top-4 right-4 text-white text-3xl font-bold focus:outline-none'>
        <X className='w-8 h-8 hover:scale-110 transition cursor-pointer'/>
       </button>

       {/* Content Wrapper */}
       <div className='max-w-[90vw] max-h-[90vh] flex items-center justify-center'>
            {renderContent()}
       </div>
    </div>
  )
}

export default StoryViewer
