import React from 'react'

const Avatar = ({ 
  src, 
  name = '', 
  size = 'md', 
  className = '', 
  onClick,
  showOnlineStatus = false,
  isOnline = false,
  gradient = true 
}) => {
  // Size configurations
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm', 
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-20 h-20 text-xl',
    '2xl': 'w-24 h-24 text-2xl'
  }

  // Get initials from name
  const getInitials = (name) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Generate consistent color based on name
  const getGradientColors = (name) => {
    if (!name) return 'from-gray-400 to-gray-500'
    
    const gradients = [
      'from-blue-400 to-blue-600',
      'from-purple-400 to-purple-600', 
      'from-pink-400 to-pink-600',
      'from-indigo-400 to-indigo-600',
      'from-green-400 to-green-600',
      'from-yellow-400 to-yellow-600',
      'from-red-400 to-red-600',
      'from-teal-400 to-teal-600',
      'from-orange-400 to-orange-600',
      'from-cyan-400 to-cyan-600'
    ]
    
    // Use name to get consistent color
    const index = name.charCodeAt(0) % gradients.length
    return gradients[index]
  }

  const initials = getInitials(name)
  const gradientClass = gradient ? getGradientColors(name) : 'from-gray-400 to-gray-500'
  const sizeClass = sizeClasses[size] || sizeClasses.md

  return (
    <div className="relative inline-block">
      <div 
        className={`
          ${sizeClass} 
          rounded-full 
          flex 
          items-center 
          justify-center 
          font-medium 
          text-white 
          shadow-lg 
          transition-all 
          duration-200 
          ${onClick ? 'cursor-pointer hover:scale-105 hover:shadow-xl' : ''} 
          ${className}
        `}
        onClick={onClick}
      >
        {src ? (
          <img 
            src={src} 
            alt={name} 
            className="w-full h-full rounded-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}
          />
        ) : null}
        
        {/* Fallback initials with gradient */}
        <div 
          className={`
            w-full 
            h-full 
            rounded-full 
            bg-gradient-to-br 
            ${gradientClass} 
            flex 
            items-center 
            justify-center 
            ${src ? 'hidden' : 'flex'}
          `}
        >
          {initials}
        </div>
      </div>

      {/* Online status indicator */}
      {showOnlineStatus && (
        <div className={`
          absolute 
          -bottom-0 
          -right-0 
          w-3 
          h-3 
          rounded-full 
          border-2 
          border-white 
          ${isOnline ? 'bg-green-400' : 'bg-gray-400'}
        `} />
      )}
    </div>
  )
}

export default Avatar
