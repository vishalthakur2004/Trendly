import React, { useState } from 'react'
import { Heart, MessageCircle, Play } from 'lucide-react'
import PostCard from './PostCard'

const ProfilePostsGrid = ({ posts, user }) => {
  const [selectedPost, setSelectedPost] = useState(null)

  const handlePostClick = (post) => {
    setSelectedPost(post)
  }

  const closeModal = () => {
    setSelectedPost(null)
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-1 md:gap-2">
        {posts.map((post) => (
          <div
            key={post._id}
            className="aspect-square bg-gray-100 cursor-pointer group relative overflow-hidden"
            onClick={() => handlePostClick(post)}
          >
            {post.image_urls && post.image_urls.length > 0 ? (
              <>
                <img
                  src={post.image_urls[0]}
                  alt="Post"
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                
                {/* Multiple images indicator */}
                {post.image_urls.length > 1 && (
                  <div className="absolute top-2 right-2">
                    <div className="bg-black bg-opacity-60 rounded-full p-1">
                      <div className="grid grid-cols-2 gap-0.5">
                        <div className="w-1 h-1 bg-white rounded-full"></div>
                        <div className="w-1 h-1 bg-white rounded-full"></div>
                        <div className="w-1 h-1 bg-white rounded-full"></div>
                        <div className="w-1 h-1 bg-white rounded-full"></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Hover overlay with stats */}
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="flex items-center gap-6 text-white">
                    <div className="flex items-center gap-1">
                      <Heart className="w-5 h-5 fill-white" />
                      <span className="font-semibold text-sm">
                        {Array.isArray(post.likes_count) ? post.likes_count.length : 0}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-5 h-5 fill-white" />
                      <span className="font-semibold text-sm">
                        {post.comments_count || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              // Text-only post placeholder
              <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-4">
                <div className="text-center">
                  <MessageCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-600 font-medium leading-tight line-clamp-3">
                    {post.content?.substring(0, 60)}
                    {post.content?.length > 60 ? '...' : ''}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Full Post Modal */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-lg w-full max-h-full overflow-hidden">
            {/* Close button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Post content */}
            <div className="bg-white rounded-xl max-h-full overflow-y-auto">
              <PostCard post={selectedPost} />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ProfilePostsGrid
