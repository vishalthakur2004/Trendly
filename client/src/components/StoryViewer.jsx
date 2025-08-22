import { BadgeCheck, X, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import React, { useEffect, useState, useRef, useCallback } from 'react'

const StoryViewer = ({ stories, initialStoryIndex = 0, onClose }) => {
    // Group stories by user
    const groupedStories = stories.reduce((groups, story) => {
        const userId = story.user._id
        if (!groups[userId]) {
            groups[userId] = {
                user: story.user,
                stories: []
            }
        }
        groups[userId].stories.push(story)
        return groups
    }, {})

    const userGroups = Object.values(groupedStories)
    
    // Find initial user group based on the initial story
    const initialStory = stories[initialStoryIndex]
    const initialUserGroupIndex = userGroups.findIndex(
        group => group.user._id === initialStory?.user._id
    )
    const initialStoryInGroupIndex = userGroups[initialUserGroupIndex]?.stories.findIndex(
        story => story._id === initialStory?._id
    ) || 0

    const [currentUserGroupIndex, setCurrentUserGroupIndex] = useState(initialUserGroupIndex || 0)
    const [currentStoryIndex, setCurrentStoryIndex] = useState(initialStoryInGroupIndex)
    const [progress, setProgress] = useState(0)
    const [isPaused, setIsPaused] = useState(false)
    const [startTime, setStartTime] = useState(null)
    const [elapsedBeforePause, setElapsedBeforePause] = useState(0)

    const progressRef = useRef(null)
    const videoRef = useRef(null)
    const touchStartX = useRef(null)
    const touchStartY = useRef(null)

    const currentUserGroup = userGroups[currentUserGroupIndex]
    const currentStory = currentUserGroup?.stories[currentStoryIndex]
    const isVideo = currentStory?.media_type === 'video'
    const duration = isVideo ? null : 5000 // 5 seconds for non-video stories

    // Reset progress when story changes
    useEffect(() => {
        setProgress(0)
        setIsPaused(false)
        setStartTime(Date.now())
        setElapsedBeforePause(0)
    }, [currentUserGroupIndex, currentStoryIndex])

    // Progress animation for non-video stories
    useEffect(() => {
        if (!currentStory || isVideo || isPaused) return

        const animate = () => {
            if (isPaused) return

            const now = Date.now()
            const elapsed = elapsedBeforePause + (now - startTime)
            const newProgress = Math.min((elapsed / duration) * 100, 100)
            
            setProgress(newProgress)

            if (newProgress >= 100) {
                handleNext()
            } else {
                progressRef.current = requestAnimationFrame(animate)
            }
        }

        progressRef.current = requestAnimationFrame(animate)

        return () => {
            if (progressRef.current) {
                cancelAnimationFrame(progressRef.current)
            }
        }
    }, [currentStory, isPaused, startTime, elapsedBeforePause, duration])

    const handleNext = useCallback(() => {
        const currentGroup = userGroups[currentUserGroupIndex]
        
        // Check if there's a next story in current user group
        if (currentStoryIndex < currentGroup.stories.length - 1) {
            setCurrentStoryIndex(currentStoryIndex + 1)
        } else if (currentUserGroupIndex < userGroups.length - 1) {
            // Move to next user group
            setCurrentUserGroupIndex(currentUserGroupIndex + 1)
            setCurrentStoryIndex(0)
        } else {
            // No more stories, close viewer
            onClose()
        }
    }, [currentUserGroupIndex, currentStoryIndex, userGroups, onClose])

    const handlePrevious = useCallback(() => {
        // Check if there's a previous story in current user group
        if (currentStoryIndex > 0) {
            setCurrentStoryIndex(currentStoryIndex - 1)
        } else if (currentUserGroupIndex > 0) {
            // Move to previous user group, go to last story
            const prevGroupIndex = currentUserGroupIndex - 1
            const prevGroup = userGroups[prevGroupIndex]
            setCurrentUserGroupIndex(prevGroupIndex)
            setCurrentStoryIndex(prevGroup.stories.length - 1)
        }
    }, [currentUserGroupIndex, currentStoryIndex, userGroups])

    const togglePause = () => {
        if (isVideo && videoRef.current) {
            if (isPaused) {
                videoRef.current.play()
            } else {
                videoRef.current.pause()
            }
        } else {
            if (isPaused) {
                setStartTime(Date.now())
            } else {
                setElapsedBeforePause(prev => prev + (Date.now() - startTime))
            }
        }
        setIsPaused(!isPaused)
    }

    // Touch/swipe handling
    const handleTouchStart = (e) => {
        touchStartX.current = e.touches[0].clientX
        touchStartY.current = e.touches[0].clientY
    }

    const handleTouchEnd = (e) => {
        if (!touchStartX.current || !touchStartY.current) return

        const touchEndX = e.changedTouches[0].clientX
        const touchEndY = e.changedTouches[0].clientY
        const diffX = touchStartX.current - touchEndX
        const diffY = touchStartY.current - touchEndY

        // Check if it's a horizontal swipe (not vertical scroll)
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
            if (diffX > 0) {
                handleNext() // Swipe left = next
            } else {
                handlePrevious() // Swipe right = previous
            }
        }

        touchStartX.current = null
        touchStartY.current = null
    }

    // Click handling for left/right navigation
    const handleClick = (e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const clickX = e.clientX - rect.left
        const width = rect.width

        if (clickX < width / 3) {
            handlePrevious()
        } else if (clickX > (2 * width) / 3) {
            handleNext()
        } else {
            togglePause()
        }
    }

    const handleVideoEnded = () => {
        handleNext()
    }

    const handleKeyDown = (e) => {
        switch (e.key) {
            case 'ArrowLeft':
                handlePrevious()
                break
            case 'ArrowRight':
            case ' ':
                if (e.key === ' ') {
                    e.preventDefault()
                    togglePause()
                } else {
                    handleNext()
                }
                break
            case 'Escape':
                onClose()
                break
        }
    }

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [handleKeyDown])

    if (!currentStory) return null

    const renderContent = () => {
        // Check if this is a shared post story
        if (currentStory.shared_post) {
            return (
                <div className='w-full max-w-md mx-auto p-4'>
                    {/* User's story content */}
                    {currentStory.content && (
                        <div className='mb-4 p-3 bg-black bg-opacity-50 rounded-lg'>
                            <p className='text-white text-lg text-center'>{currentStory.content}</p>
                        </div>
                    )}

                    {/* Shared post card */}
                    <div className='bg-white rounded-lg p-4 shadow-lg'>
                        <div className='flex items-center gap-2 mb-3'>
                            <img
                                src={currentStory.shared_post.user.profile_picture}
                                alt={currentStory.shared_post.user.full_name}
                                className='w-8 h-8 rounded-full'
                            />
                            <div>
                                <p className='text-gray-900 font-medium text-sm'>{currentStory.shared_post.user.full_name}</p>
                                <p className='text-gray-500 text-xs'>@{currentStory.shared_post.user.username}</p>
                            </div>
                        </div>

                        {currentStory.shared_post.content && (
                            <p className='text-gray-800 text-sm mb-3'>{currentStory.shared_post.content}</p>
                        )}

                        {currentStory.shared_post.image_urls && currentStory.shared_post.image_urls.length > 0 && (
                            <div className='grid gap-2'>
                                {currentStory.shared_post.image_urls.slice(0, 2).map((img, index) => (
                                    <img
                                        key={index}
                                        src={img}
                                        alt=""
                                        className='w-full h-32 object-cover rounded'
                                    />
                                ))}
                                {currentStory.shared_post.image_urls.length > 2 && (
                                    <div className='text-center text-gray-500 text-xs'>
                                        +{currentStory.shared_post.image_urls.length - 2} more images
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )
        }

        // Regular story content
        switch (currentStory.media_type) {
            case 'image':
                return (
                    <img 
                        src={currentStory.media_url} 
                        alt="" 
                        className='max-w-full max-h-screen object-contain'
                        draggable={false}
                    />
                )
            case 'video':
                return (
                    <video 
                        ref={videoRef}
                        onEnded={handleVideoEnded}
                        src={currentStory.media_url} 
                        className='max-h-screen' 
                        controls={false}
                        autoPlay
                        playsInline
                    />
                )
            case 'text':
                return (
                    <div className='w-full h-full flex items-center justify-center p-8 text-white text-2xl text-center'>
                        {currentStory.content}
                    </div>
                )
            default:
                return null
        }
    }

    return (
        <div 
            className='fixed inset-0 h-screen bg-black z-50 flex items-center justify-center select-none'
            style={{backgroundColor: currentStory.media_type === 'text' ? currentStory.background_color : '#000000'}}
            onClick={handleClick}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            {/* Progress Bars */}
            <div className='absolute top-2 left-4 right-4 flex gap-1 z-20'>
                {currentUserGroup.stories.map((_, index) => (
                    <div key={index} className='flex-1 h-1 bg-white bg-opacity-30 rounded-full overflow-hidden'>
                        <div 
                            className='h-full bg-white transition-all duration-100'
                            style={{
                                width: index < currentStoryIndex 
                                    ? '100%' 
                                    : index === currentStoryIndex 
                                        ? `${isVideo ? 0 : progress}%` 
                                        : '0%'
                            }}
                        />
                    </div>
                ))}
            </div>

            {/* User Info */}
            <div className='absolute top-6 left-4 flex items-center space-x-3 p-2 px-4 backdrop-blur-sm rounded-full bg-black bg-opacity-50 z-20'>
                <img 
                    src={currentStory.user?.profile_picture} 
                    alt="" 
                    className='w-8 h-8 rounded-full object-cover border border-white'
                />
                <div className='text-white font-medium flex items-center gap-1.5'>
                    <span>{currentStory.user?.full_name}</span>
                    <BadgeCheck size={16}/>
                    <span className='text-sm opacity-75'>
                        {currentStoryIndex + 1}/{currentUserGroup.stories.length}
                    </span>
                </div>
            </div>

            {/* Navigation arrows for desktop */}
            <button 
                onClick={(e) => { e.stopPropagation(); handlePrevious(); }}
                className='absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-black hover:bg-opacity-50 rounded-full p-2 transition-all z-20 hidden md:block'
                disabled={currentUserGroupIndex === 0 && currentStoryIndex === 0}
            >
                <ChevronLeft className='w-6 h-6' />
            </button>

            <button 
                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                className='absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-black hover:bg-opacity-50 rounded-full p-2 transition-all z-20 hidden md:block'
            >
                <ChevronRight className='w-6 h-6' />
            </button>

            {/* Pause/Play indicator */}
            {isPaused && (
                <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white z-20'>
                    <div className='bg-black bg-opacity-50 rounded-full p-4'>
                        <Play className='w-8 h-8' />
                    </div>
                </div>
            )}

            {/* Close Button */}
            <button 
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                className='absolute top-4 right-4 text-white hover:bg-black hover:bg-opacity-50 rounded-full p-2 transition-all z-20'
            >
                <X className='w-6 h-6' />
            </button>

            {/* Content Wrapper */}
            <div className='max-w-[90vw] max-h-[90vh] flex items-center justify-center pointer-events-none'>
                {renderContent()}
            </div>

            {/* Invisible click areas for mobile navigation */}
            <div className='absolute inset-0 flex md:hidden'>
                <div className='w-1/3 h-full' onClick={(e) => { e.stopPropagation(); handlePrevious(); }} />
                <div className='w-1/3 h-full' onClick={(e) => { e.stopPropagation(); togglePause(); }} />
                <div className='w-1/3 h-full' onClick={(e) => { e.stopPropagation(); handleNext(); }} />
            </div>
        </div>
    )
}

export default StoryViewer
