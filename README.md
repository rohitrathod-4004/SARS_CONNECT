# ✨ SARS CONNECT - Full Stack Realtime Chat App ✨

## Features

- 🌟 **Tech Stack**: MERN (MongoDB, Express, React, Node.js) + Socket.io + TailwindCSS + Daisy UI
- 🎃 **Authentication & Authorization**: Secure JWT-based authentication
- 👾 **Real-time Messaging**: Instant messaging with Socket.io
- � **Group Chat**: Create and manage group conversations
- �🚀 **Online User Status**: See who's online in real-time
- � **Media Sharing**: Send images and videos in chats
- 👌 **State Management**: Efficient global state with Zustand
- 🎨 **Modern UI**: Beautiful, responsive design with dark mode support
- 🐞 **Error Handling**: Robust error handling on both client and server

## Setup

### Environment Variables

Create a `.env` file in the backend directory with the following variables:

```js
MONGODB_URI=...
PORT=5001
JWT_SECRET=...

CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

NODE_ENV=development
```

### Installation & Running

1. **Build the app**
   ```shell
   npm run build
   ```

2. **Start the app**
   ```shell
   npm start
   ```

3. **Development mode**
   ```shell
   # Backend
   cd backend
   npm run dev
   
   # Frontend (in another terminal)
   cd frontend
   npm run dev
   ```

## Tech Stack

- **Frontend**: React, TailwindCSS, DaisyUI, Zustand
- **Backend**: Node.js, Express, MongoDB, Socket.io
- **Authentication**: JWT (JSON Web Tokens)
- **Media Storage**: Cloudinary
- **Real-time Communication**: Socket.io
