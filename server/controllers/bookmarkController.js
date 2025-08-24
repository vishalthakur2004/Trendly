import Post from "../models/Post.js";
import User from "../models/User.js";

// Toggle bookmark for a post
export const toggleBookmark = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { postId } = req.body;

        if (!postId) {
            return res.json({ success: false, message: "Post ID is required" });
        }

        // Check if post exists
        const post = await Post.findById(postId);
        if (!post) {
            return res.json({ success: false, message: "Post not found" });
        }

        // Get user and check if post is already saved
        const user = await User.findById(userId);
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        const isBookmarked = user.saved_posts.includes(postId);

        if (isBookmarked) {
            // Remove bookmark
            user.saved_posts = user.saved_posts.filter(savedPostId => savedPostId !== postId);
            await user.save();
            
            res.json({ 
                success: true, 
                message: "Post removed from bookmarks",
                isBookmarked: false
            });
        } else {
            // Add bookmark
            user.saved_posts.push(postId);
            await user.save();
            
            res.json({ 
                success: true, 
                message: "Post bookmarked successfully",
                isBookmarked: true
            });
        }

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Failed to toggle bookmark. Please try again." });
    }
};

// Get user's bookmarked posts
export const getBookmarkedPosts = async (req, res) => {
    try {
        const { userId } = req.auth();

        const user = await User.findById(userId).populate({
            path: 'saved_posts',
            populate: [
                {
                    path: 'user',
                    select: 'full_name username profile_picture'
                },
                {
                    path: 'likes_count',
                    select: 'full_name username profile_picture',
                    options: { limit: 20 }
                }
            ],
            options: { sort: { createdAt: -1 } }
        });

        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        // Filter out any null posts (in case some posts were deleted)
        const validBookmarkedPosts = user.saved_posts.filter(post => post !== null);

        // Sort likes to prioritize user's connections for each post
        const userConnections = new Set([...user.connections, ...user.following]);

        const processedPosts = validBookmarkedPosts.map(post => {
            const postObj = post.toObject();

            if (postObj.likes_count && postObj.likes_count.length > 0) {
                // Separate likes into connections and non-connections
                const connectionLikes = [];
                const otherLikes = [];

                postObj.likes_count.forEach(like => {
                    if (like._id === userId || userConnections.has(like._id)) {
                        connectionLikes.push(like);
                    } else {
                        otherLikes.push(like);
                    }
                });

                // Sort connections: current user first, then alphabetically
                connectionLikes.sort((a, b) => {
                    if (a._id === userId) return -1;
                    if (b._id === userId) return 1;
                    return (a.full_name || a.username).localeCompare(b.full_name || b.username);
                });

                // Combine: connections first, then others
                postObj.likes_count = [...connectionLikes, ...otherLikes];
            }

            return postObj;
        });

        res.json({ 
            success: true, 
            posts: processedPosts,
            count: processedPosts.length
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Failed to fetch bookmarked posts. Please try again." });
    }
};

// Check if posts are bookmarked (for multiple posts)
export const checkBookmarkStatus = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { postIds } = req.body;

        if (!postIds || !Array.isArray(postIds)) {
            return res.json({ success: false, message: "Post IDs array is required" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        const bookmarkStatus = {};
        postIds.forEach(postId => {
            bookmarkStatus[postId] = user.saved_posts.includes(postId);
        });

        res.json({ 
            success: true, 
            bookmarkStatus 
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Failed to check bookmark status." });
    }
};
