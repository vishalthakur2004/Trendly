import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useAuth } from '@clerk/clerk-react'
import { Bookmark } from 'lucide-react'
import PostCard from '../components/PostCard'
import Loading from '../components/Loading'
import { fetchBookmarkedPosts, clearBookmarksError } from '../features/bookmarks/bookmarksSlice'
import toast from 'react-hot-toast'

const Bookmarks = () => {
    const dispatch = useDispatch()
    const { getToken } = useAuth()
    const { posts, loading, error, count } = useSelector((state) => state.bookmarks)

    useEffect(() => {
        const loadBookmarks = async () => {
            try {
                const token = await getToken()
                await dispatch(fetchBookmarkedPosts({ token })).unwrap()
            } catch (error) {
                toast.error(error || 'Failed to load bookmarks')
            }
        }

        loadBookmarks()
    }, [dispatch, getToken])

    useEffect(() => {
        if (error) {
            toast.error(error)
            dispatch(clearBookmarksError())
        }
    }, [error, dispatch])

    if (loading) {
        return <Loading />
    }

    return (
        <div className='h-full overflow-y-scroll no-scrollbar bg-gray-50'>
            {/* Main Container */}
            <div className='max-w-lg mx-auto bg-white md:bg-gray-50'>
                
                {/* Header */}
                <div className='bg-white border-b border-gray-200 md:border-none md:bg-transparent md:pt-6'>
                    <div className='p-4 md:p-6'>
                        <div className='flex items-center gap-3 mb-2'>
                            <Bookmark className='w-6 h-6 text-blue-600' />
                            <h1 className='text-xl font-bold text-gray-900'>Bookmarks</h1>
                        </div>
                        <p className='text-gray-600 text-sm'>
                            {count === 0 ? 'No saved posts yet' : `${count} saved ${count === 1 ? 'post' : 'posts'}`}
                        </p>
                    </div>
                </div>

                {/* Content */}
                {posts.length === 0 ? (
                    <div className='flex flex-col items-center justify-center py-16 px-4'>
                        <div className='w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6'>
                            <Bookmark className='w-12 h-12 text-gray-400' />
                        </div>
                        <h2 className='text-xl font-semibold text-gray-900 mb-2'>No bookmarks yet</h2>
                        <p className='text-gray-600 text-center max-w-sm leading-relaxed'>
                            When you bookmark posts, they'll appear here. Tap the bookmark icon on any post to save it for later.
                        </p>
                        <div className='mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100'>
                            <div className='flex items-center gap-2 text-blue-700 text-sm'>
                                <Bookmark className='w-4 h-4' />
                                <span className='font-medium'>Tip: Look for the bookmark icon on posts to save them</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className='space-y-0 md:space-y-6 md:pt-6 pb-20 md:pb-6'>
                        {posts.map((post) => (
                            <div key={post._id} className='bg-white md:rounded-xl md:shadow-sm border-b border-gray-200 md:border-none'>
                                <PostCard post={post} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Bookmarks
