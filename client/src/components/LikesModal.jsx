import React from 'react'
import { X, Heart } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const LikesModal = ({ isOpen, onClose, likedUsers, currentUser }) => {
  const navigate = useNavigate()

  if (!isOpen) return null

  const handleUserClick = (userId) => {
    navigate(`/profile/${userId}`)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md mx-4 max-h-96 overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Likes</h3>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Users List */}
        <div className="overflow-y-auto max-h-80">
          {likedUsers.length === 0 ? (
            <div className="text-center py-8">
              <Heart className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No likes yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {likedUsers.map((user) => (
                <div 
                  key={user._id}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleUserClick(user._id)}
                >
                  <div className="flex items-center gap-3">
                    <img 
                      src={user.profile_picture} 
                      alt={user.full_name}
                      className="w-10 h-10 rounded-full ring-2 ring-gray-100"
                    />
                    <div>
                      <p className="font-semibold text-gray-900">
                        {user._id === currentUser._id ? 'You' : user.full_name}
                      </p>
                      <p className="text-sm text-gray-500">@{user.username}</p>
                    </div>
                  </div>
                  <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <p className="text-sm text-gray-500 text-center">
            {likedUsers.length} {likedUsers.length === 1 ? 'person' : 'people'} liked this post
          </p>
        </div>
      </div>
    </div>
  )
}

export default LikesModal
