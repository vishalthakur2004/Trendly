import fs from "fs";
import imagekit from "../configs/imageKit.js";
import Post from "../models/Post.js";
import User from "../models/User.js";
import Message from "../models/Message.js";
import { createNotification, generateNotificationContent } from "./notificationController.js";

// Add Post
export const addPost = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { content, post_type } = req.body;
        const images = req.files

        let image_urls = []

        if(images.length){
            image_urls = await Promise.all(
                images.map(async (image) => {
                    const fileBuffer = fs.readFileSync(image.path)
                     const response = await imagekit.upload({
                            file: fileBuffer,
                            fileName: image.originalname,
                            folder: "posts",
                        })

                        const url = imagekit.url({
                            path: response.filePath,
                            transformation: [
                                {quality: 'auto'},
                                { format: 'webp' },
                                { width: '1280' }
                            ]
                        })
                        return url
                })
            )
        }

        await Post.create({
            user: userId,
            content,
            image_urls,
            post_type
        })
        res.json({ success: true, message: "Post created successfully" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Get Posts
export const getFeedPosts = async (req, res) =>{
    try {
        const { userId } = req.auth()
        const user = await User.findById(userId)

        // User connections and followings
        const userIds = [userId, ...user.connections, ...user.following]
        const posts = await Post.find({user: {$in: userIds}})
            .populate('user')
            .populate({
                path: 'likes_count',
                select: 'full_name username profile_picture',
                options: { limit: 20 } // Limit to prevent performance issues
            })
            .sort({createdAt: -1});

        // Sort likes to prioritize user's connections
        const userConnections = new Set([...user.connections, ...user.following]);

        const processedPosts = posts.map(post => {
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

        res.json({ success: true, posts: processedPosts})
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Like Post
export const likePost = async (req, res) =>{
    try {
        const { userId } = req.auth()
        const { postId } = req.body;

        const post = await Post.findById(postId)

        if (!post) {
            return res.json({ success: false, message: 'Post not found' });
        }

        const wasLiked = post.likes_count.includes(userId);

        if(wasLiked){
            post.likes_count = post.likes_count.filter(user => user !== userId)
            await post.save()
        }else{
            post.likes_count.push(userId)
            await post.save()

            // Create notification for post like
            if (post.user !== userId) {
                const liker = await User.findById(userId);
                if (liker) {
                    await createNotification({
                        recipient: post.user,
                        sender: userId,
                        type: 'like',
                        content: generateNotificationContent('like', liker.full_name),
                        related_post: post._id,
                        action_url: `/feed?post=${post._id}`
                    });
                }
            }
        }

        // Get updated post with populated likes and prioritize connections
        const user = await User.findById(userId);
        const updatedPost = await Post.findById(postId)
            .populate({
                path: 'likes_count',
                select: 'full_name username profile_picture',
                options: { limit: 20 }
            });

        // Sort likes to prioritize user's connections
        const userConnections = new Set([...user.connections, ...user.following]);
        let sortedLikes = [];

        if (updatedPost.likes_count && updatedPost.likes_count.length > 0) {
            const connectionLikes = [];
            const otherLikes = [];

            updatedPost.likes_count.forEach(like => {
                if (like._id.toString() === userId || userConnections.has(like._id.toString())) {
                    connectionLikes.push(like);
                } else {
                    otherLikes.push(like);
                }
            });

            // Sort connections: current user first, then alphabetically
            connectionLikes.sort((a, b) => {
                if (a._id.toString() === userId) return -1;
                if (b._id.toString() === userId) return 1;
                return (a.full_name || a.username).localeCompare(b.full_name || b.username);
            });

            sortedLikes = [...connectionLikes, ...otherLikes];
        }

        res.json({
            success: true,
            message: wasLiked ? 'Post unliked' : 'Post liked',
            likes: sortedLikes,
            likesCount: updatedPost.likes_count.length
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Failed to like post. Please try again." });
    }
}

// Share Post in Chat
export const sharePost = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { postId, recipientIds, message: shareMessage = "" } = req.body;

        if (!postId || !recipientIds || !Array.isArray(recipientIds) || recipientIds.length === 0) {
            return res.json({ success: false, message: "Post ID and recipient list are required" });
        }

        // Check if post exists
        const post = await Post.findById(postId);
        if (!post) {
            return res.json({ success: false, message: "Post not found" });
        }

        // Create share messages for each recipient
        const sharePromises = recipientIds.map(recipientId => {
            return Message.create({
                from_user_id: userId,
                to_user_id: recipientId,
                text: shareMessage,
                message_type: 'shared_post',
                shared_post: postId
            });
        });

        await Promise.all(sharePromises);

        // Increment post shares count
        await Post.findByIdAndUpdate(postId, { $inc: { shares_count: 1 } });

        res.json({
            success: true,
            message: `Post shared with ${recipientIds.length} ${recipientIds.length === 1 ? 'person' : 'people'}`
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Failed to share post. Please try again." });
    }
};

// Get User Connections for Sharing
export const getUserConnections = async (req, res) => {
    try {
        const { userId } = req.auth();

        const user = await User.findById(userId)
            .populate('connections', 'full_name username profile_picture')
            .populate('following', 'full_name username profile_picture');

        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        // Combine connections and following, remove duplicates
        const allConnections = [...user.connections, ...user.following];
        const uniqueConnections = allConnections.filter((connection, index, self) =>
            index === self.findIndex(c => c._id.toString() === connection._id.toString())
        );

        res.json({ success: true, connections: uniqueConnections });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Failed to load connections" });
    }
};
