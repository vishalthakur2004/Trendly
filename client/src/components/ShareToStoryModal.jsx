import React, { useState } from 'react'
import { X, Image, Type } from 'lucide-react'
import { useAuth } from '@clerk/clerk-react'
import api from '../api/axios'
import toast from 'react-hot-toast'

const ShareToStoryModal = ({ isOpen, onClose, post }) => {
    const [content, setContent] = useState('')
    const [isSharing, setIsSharing] = useState(false)
    const { getToken } = useAuth()

    const handleShareToStory = async () => {
        try {
            setIsSharing(true)
            
            const { data } = await api.post('/api/story/share-post', 
                {
                    postId: post._id,
                    content: content.trim()
                },
                { 
                    headers: { 
                        Authorization: `Bearer ${await getToken()}` 
                    } 
                }
            )

            if (data.success) {
                toast.success(data.message || 'Post shared to your story!')
                onClose()
                setContent('')
            } else {
                toast.error(data.message || 'Failed to share post')
            }
        } catch (error) {
            console.log(error)
            toast.error(error.response?.data?.message || 'Failed to share post')
        } finally {
            setIsSharing(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
            <div className='bg-white rounded-xl w-full max-w-md max-h-[90vh] flex flex-col'>
                {/* Header */}
                <div className='flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0'>
                    <h2 className='text-lg font-semibold text-gray-900'>Share to Story</h2>
                    <button
                        onClick={onClose}
                        className='w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors'
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className='flex-1 overflow-y-auto p-4 space-y-4'>
                    {/* Post Preview */}
                    <div className='border rounded-lg p-3 bg-gray-50'>
                        <div className='flex items-center gap-2 mb-2'>
                            <img 
                                src={post.user.profile_picture} 
                                alt={post.user.full_name}
                                className='w-6 h-6 rounded-full'
                            />
                            <span className='text-sm font-medium text-gray-700'>
                                {post.user.full_name}'s post
                            </span>
                        </div>
                        
                        {post.content && (
                            <p className='text-sm text-gray-600 mb-2 line-clamp-2'>
                                {post.content}
                            </p>
                        )}
                        
                        {post.image_urls && post.image_urls.length > 0 && (
                            <div className='flex gap-1'>
                                {post.image_urls.slice(0, 3).map((img, index) => (
                                    <img 
                                        key={index}
                                        src={img} 
                                        alt=""
                                        className='w-12 h-12 object-cover rounded'
                                    />
                                ))}
                                {post.image_urls.length > 3 && (
                                    <div className='w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500'>
                                        +{post.image_urls.length - 3}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Add Message */}
                    <div className='space-y-2'>
                        <label className='text-sm font-medium text-gray-700 flex items-center gap-2'>
                            <Type className="w-4 h-4" />
                            Add a message (optional)
                        </label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Say something about this post..."
                            className='w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                            rows={3}
                            maxLength={150}
                        />
                        <div className='text-xs text-gray-500 text-right'>
                            {content.length}/150
                        </div>
                    </div>

                    {/* Story Preview */}
                    <div className='space-y-2'>
                        <div className='text-sm font-medium text-gray-700 flex items-center gap-2'>
                            <Image className="w-4 h-4" />
                            Story Preview
                        </div>
                        <div className='aspect-[9/16] bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg relative overflow-hidden max-w-[200px] mx-auto'>
                            {post.image_urls && post.image_urls.length > 0 ? (
                                <img 
                                    src={post.image_urls[0]} 
                                    alt=""
                                    className='w-full h-full object-cover'
                                />
                            ) : null}
                            <div className='absolute inset-0 bg-black bg-opacity-30 flex flex-col justify-end p-3'>
                                {content && (
                                    <div className='bg-black bg-opacity-50 rounded p-2 mb-2'>
                                        <p className='text-white text-xs'>{content}</p>
                                    </div>
                                )}
                                <div className='bg-white bg-opacity-90 rounded p-2 text-xs'>
                                    <p className='text-gray-800 font-medium'>{post.user.full_name}</p>
                                    <p className='text-gray-600 line-clamp-1'>{post.content}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className='p-4 border-t border-gray-200 flex-shrink-0'>
                    <div className='flex gap-3'>
                        <button
                            onClick={onClose}
                            className='flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors'
                            disabled={isSharing}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleShareToStory}
                            disabled={isSharing}
                            className='flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                        >
                            {isSharing ? 'Sharing...' : 'Share to Story'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ShareToStoryModal
