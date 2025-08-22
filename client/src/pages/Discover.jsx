import React, { useEffect, useState } from 'react'
import { Search, Users, Sparkles, RefreshCw } from 'lucide-react'
import UserCard from '../components/UserCard'
import SuggestedUserCard from '../components/SuggestedUserCard'
import Loading from '../components/Loading'
import api from '../api/axios'
import { useAuth } from '@clerk/clerk-react'
import toast from 'react-hot-toast'
import { useDispatch } from 'react-redux'
import { fetchUser } from '../features/user/userSlice'

const Discover = () => {

  const dispatch = useDispatch()
  const [input, setInput] = useState('')
  const [users, setUsers] = useState([])
  const [suggestedUsers, setSuggestedUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('suggested') // 'suggested' or 'search'
  const { getToken } = useAuth()

  const handleSearch = async (e) => {
    if(e.key === 'Enter' && input.trim()){
      try {
        setUsers([])
        setLoading(true)
        setActiveTab('search')
        const { data } = await api.post('/api/user/discover', {input}, {
          headers: { Authorization: `Bearer ${await getToken()}` }
        })
        data.success ? setUsers(data.users) : toast.error(data.message)
        setLoading(false)
        setInput('')
      } catch (error) {
        toast.error(error.message)
        setLoading(false)
      }
    }
  }

  const loadSuggestedConnections = async () => {
    try {
      setSuggestionsLoading(true)
      const token = await getToken()

      if (!token) {
        toast.error('Authentication required')
        return
      }

      const { data } = await api.get('/api/user/suggested-connections?limit=20', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (data.success) {
        setSuggestedUsers(data.suggestedUsers || [])
        console.log('Loaded suggested connections:', data.suggestedUsers?.length || 0)
      } else {
        console.error('API error:', data.message)
        toast.error(data.message || 'Failed to load suggested connections')
      }
    } catch (error) {
      console.error('Error loading suggested connections:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load suggested connections'
      toast.error(errorMessage)
    } finally {
      setSuggestionsLoading(false)
    }
  }

  const handleRefreshSuggestions = () => {
    loadSuggestedConnections()
  }

  useEffect(()=>{
    const initializeData = async () => {
      const token = await getToken()
      dispatch(fetchUser(token))
      loadSuggestedConnections()
    }
    initializeData()
  },[])

  return (
    <div className='min-h-screen bg-gradient-to-b from-slate-50 to-white'>
      <div className='max-w-7xl mx-auto p-6'>

        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-slate-900 mb-2'>Discover People</h1>
          <p className='text-slate-600'>Connect with amazing people and grow your network</p>
        </div>

        {/* Search */}
        <div className='mb-8 shadow-md rounded-lg border border-slate-200/60 bg-white/90'>
          <div className='p-6'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5' />
              <input
                type="text"
                placeholder='Search people by name, username, bio, or location...'
                className='pl-10 sm:pl-12 py-3 w-full border border-gray-300 rounded-lg max-sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                onChange={(e)=>setInput(e.target.value)}
                value={input}
                onKeyUp={handleSearch}
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className='flex items-center justify-between mb-6'>
          <div className='flex gap-2'>
            <button
              onClick={() => setActiveTab('suggested')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'suggested'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Sparkles className='w-4 h-4' />
              Suggested For You
              {suggestedUsers.length > 0 && (
                <span className='bg-white/20 px-2 py-0.5 rounded-full text-xs'>
                  {suggestedUsers.length}
                </span>
              )}
            </button>
            {users.length > 0 && (
              <button
                onClick={() => setActiveTab('search')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'search'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Search className='w-4 h-4' />
                Search Results
                <span className='bg-white/20 px-2 py-0.5 rounded-full text-xs'>
                  {users.length}
                </span>
              </button>
            )}
          </div>

          {activeTab === 'suggested' && (
            <button
              onClick={handleRefreshSuggestions}
              disabled={suggestionsLoading}
              className='flex items-center gap-2 px-3 py-2 text-sm text-indigo-600 hover:text-indigo-800 transition-colors disabled:opacity-50'
            >
              <RefreshCw className={`w-4 h-4 ${suggestionsLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          )}
        </div>

        {/* Content */}
        {activeTab === 'suggested' ? (
          <div>
            {suggestionsLoading ? (
              <Loading height='60vh'/>
            ) : suggestedUsers.length > 0 ? (
              <div>
                <div className='mb-4 flex items-center gap-2 text-sm text-gray-600'>
                  <Users className='w-4 h-4' />
                  <span>People you may know based on your connections</span>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
                  {suggestedUsers.map((user) => (
                    <SuggestedUserCard user={user} key={user._id} />
                  ))}
                </div>
              </div>
            ) : (
              <div className='text-center py-16'>
                <Users className='w-16 h-16 mx-auto text-gray-300 mb-4' />
                <h3 className='text-lg font-medium text-gray-900 mb-2'>
                  {suggestionsLoading ? 'Loading suggestions...' : 'No suggestions available'}
                </h3>
                <p className='text-gray-600 mb-4'>
                  {suggestionsLoading
                    ? 'Finding people you might know...'
                    : 'We\'ll show you suggested connections based on your network as it grows.'
                  }
                </p>
                {!suggestionsLoading && (
                  <button
                    onClick={loadSuggestedConnections}
                    className='px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 mx-auto'
                  >
                    <RefreshCw className='w-4 h-4' />
                    Try Again
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div>
            {loading ? (
              <Loading height='60vh'/>
            ) : users.length > 0 ? (
              <div>
                <div className='mb-4 text-sm text-gray-600'>
                  Found {users.length} {users.length === 1 ? 'person' : 'people'}
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
                  {users.map((user) => (
                    <UserCard user={user} key={user._id} />
                  ))}
                </div>
              </div>
            ) : (
              <div className='text-center py-16'>
                <Search className='w-16 h-16 mx-auto text-gray-300 mb-4' />
                <h3 className='text-lg font-medium text-gray-900 mb-2'>Search for people</h3>
                <p className='text-gray-600'>
                  Use the search bar above to find people by name, username, bio, or location.
                </p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

export default Discover
