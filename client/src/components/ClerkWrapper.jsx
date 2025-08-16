import React, { useEffect, useState } from 'react'
import { useUser, useAuth } from '@clerk/clerk-react'
import App from '../App'

const ClerkWrapper = () => {
  const [isReady, setIsReady] = useState(false)
  
  useEffect(() => {
    // Add a small delay to ensure Clerk is fully initialized
    const timer = setTimeout(() => {
      setIsReady(true)
    }, 100)
    
    return () => clearTimeout(timer)
  }, [])
  
  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900">Loading Trendly...</h2>
        </div>
      </div>
    )
  }
  
  return <App />
}

export default ClerkWrapper
