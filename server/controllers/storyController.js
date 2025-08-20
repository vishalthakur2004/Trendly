import fs from "fs";
import imagekit from "../configs/imageKit.js";
import Story from "../models/Story.js";
import User from "../models/User.js";
import Post from "../models/Post.js";
import { inngest } from "../inngest/index.js";

// Add User Story
export const addUserStory = async (req, res) =>{
    try {
        const { userId } = req.auth();
        const {content, media_type, background_color} = req.body;
        const media = req.file
        let media_url = ''

        // upload media to imagekit
        if(media_type === 'image' || media_type === 'video'){
            const fileBuffer = fs.readFileSync(media.path)
            const response = await imagekit.upload({
                file: fileBuffer,
                fileName: media.originalname,
            })
            media_url = response.url
        }
        // create story
        const story = await Story.create({
            user: userId,
            content,
            media_url,
            media_type,
            background_color
        })

        // schedule story deletion after 24 hours
        await inngest.send({
            name: 'app/story.delete',
            data: { storyId: story._id }
        })

        res.json({success: true})

    } catch (error) {
       console.log(error);
       res.json({ success: false, message: error.message }); 
    }
}

// Get User Stories
export const getStories = async (req, res) =>{
    try {
        const { userId } = req.auth();
        const user = await User.findById(userId)

        // User connections and followings 
        const userIds = [userId, ...user.connections, ...user.following]

        const stories = await Story.find({
            user: {$in: userIds}
        }).populate('user').populate({
            path: 'shared_post',
            populate: {
                path: 'user',
                select: 'full_name username profile_picture'
            }
        }).sort({ createdAt: -1 });

        res.json({ success: true, stories });
    } catch (error) {
       console.log(error);
       res.json({ success: false, message: error.message });
    }
}

// Share Post to Story
export const sharePostToStory = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { postId, content = "" } = req.body;

        // Get the post to share
        const post = await Post.findById(postId).populate('user');
        if (!post) {
            return res.json({ success: false, message: 'Post not found' });
        }

        // Create story content that references the shared post
        let storyContent = content;
        let media_url = '';
        let media_type = 'text';

        // If the post has images, use the first image as story media
        if (post.image_urls && post.image_urls.length > 0) {
            media_url = post.image_urls[0];
            media_type = 'image';
        }

        // If user didn't provide content, create default sharing text
        if (!storyContent) {
            storyContent = `Shared ${post.user.full_name}'s post`;
        }

        // Create story with shared post reference
        const story = await Story.create({
            user: userId,
            content: storyContent,
            media_url,
            media_type,
            shared_post: postId, // Reference to the original post
            background_color: media_type === 'text' ? '#4F46E5' : undefined
        });

        // Increment shares count on original post
        await Post.findByIdAndUpdate(postId, {
            $inc: { shares_count: 1 }
        });

        // Schedule story deletion after 24 hours
        await inngest.send({
            name: 'app/story.delete',
            data: { storyId: story._id }
        });

        res.json({ success: true, message: 'Post shared to your story!' });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}
