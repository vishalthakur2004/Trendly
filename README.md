# Trendly - Social Media Platform

A modern, vibrant social media platform where trends are born and connections flourish. Built with React, Node.js, and MongoDB.

## 🌟 Features

- **Feed & Stories**: Share moments with beautiful stories and engaging posts
- **Real-time Messaging**: Connect instantly with friends and followers  
- **Connections**: Build meaningful relationships with like-minded people
- **Discover**: Explore trending content and find new connections
- **Profile Management**: Customize your digital presence
- **Media Sharing**: Share photos, videos, and rich content

## 🎨 Design

Trendly features a clean, modern design with:
- Purple to orange gradient branding
- Green accent colors for primary actions
- Clean, rounded interface elements
- Responsive design for all devices
- Intuitive navigation and user experience

## 🚀 Tech Stack

**Frontend:**
- React 19 with Vite
- Tailwind CSS for styling
- Redux Toolkit for state management
- React Router for navigation
- Clerk for authentication
- Lucide React for icons

**Backend:**
- Node.js with Express
- MongoDB with Mongoose
- Real-time messaging with Server-Sent Events
- File upload with Multer
- Email notifications with Nodemailer

## 🛠️ Development

This is a monorepo structure with separate client and server applications.

### Prerequisites
- Node.js (v18 or higher)
- MongoDB
- npm or yarn

### Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd trendly
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   - Copy `.env.sample` files in both client and server directories
   - Fill in your environment variables

4. **Start development servers**
   ```bash
   # Start both client and server
   npm run dev

   # Or start individually
   npm run dev:client  # Starts React app on port 5173
   npm run dev:server  # Starts Express server on port 4000
   ```

### Available Scripts

- `npm run install:all` - Install dependencies for both client and server
- `npm run dev` - Start both development servers
- `npm run dev:client` - Start only the React development server
- `npm run dev:server` - Start only the Express server
- `npm run build` - Build the React app for production

## 📱 Features Overview

### Social Features
- Create and share posts with text and images
- Like, comment, and share content
- Real-time messaging system
- Stories with photo/video support
- User profiles with customization

### Technical Features
- Real-time notifications
- Image/video upload and processing
- Responsive mobile-first design
- SEO optimized
- Performance optimized with code splitting

## 🔧 Configuration

The application uses:
- Clerk for user authentication
- ImageKit for media processing
- MongoDB for data storage
- Tailwind CSS for styling
- Vite for fast development builds

## 📄 License

This project is part of a portfolio showcase.

---

**Trendly** - Where trends begin and connections flourish ✨
