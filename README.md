# Murmur
A full-stack social media application inspired by modern platforms, built with the MERN stack. It supports photo and video sharing, real-time messaging, stories, notifications, and a dynamic social feed. The project features a responsive frontend built with React and a robust backend powered by Node.js and Express.

---

## Features

- **Full User Authentication:** Secure sign-up, login, and account management, including profile picture uploads, bio updates, and account deletion.
- **Dynamic Content Sharing:** - Create posts with multiple photos and videos (carousels).
    - Upload 24-hour stories with in-browser video trimming for clips over 60 seconds.
- **Interactive Social Feed:** A personalized homepage feed showing the latest posts from the user and the people they follow.
- **Real-Time Interactivity:**
    - Like, unlike, and comment on posts.
    - Share posts with followers via direct message.
- **Real-Time Notifications:** Receive instant notifications for new likes, comments, and follows via WebSockets.
- **Real-Time Messaging:** A full-featured, two-pane chat interface with online status indicators.
- **Content & User Discovery:** - An "Explore" page to discover posts from other users.
    - A dynamic, slide-out search panel to find and follow other users.
- **Modern UI/UX:** - A fully responsive design with a hybrid top-header and collapsible sidebar layout.
    - A beautiful dark mode with custom fonts and a branded color scheme.

---
## Architecture Diagram
![Murmur_Architecture](https://github.com/user-attachments/assets/587d3345-03be-4092-ba13-bb7641074fe7)


---

## Tech Stack

| Layer      | Technology               | Purpose/Role                                      |
|------------|--------------------------|---------------------------------------------------|
| Frontend   | React.js (with Vite)     | UI, component management, and user interaction    |
| Styling    | Tailwind CSS             | Utility-first CSS for rapid and custom styling    |
| Components | Radix UI                 | Accessible, unstyled UI primitives (Dialog, etc.) |
| Backend    | Node.js & Express.js     | API server, business logic, user management       |
| API        | RESTful API              | Endpoints for all data (users, posts, messages)   |
| Real-time  | Socket.IO                | WebSockets for live chat and notifications        |
| Database   | MongoDB (with Mongoose)  | Stores user, post, story, and message data        |
| Media      | Cloudinary               | Cloud-based storage and delivery for all media    |
| Video Proc.| FFmpeg.wasm              | In-browser video trimming for stories             |

---

## How Does It Work?

1.  A user signs up or logs in via the React frontend. A JWT token is stored in `sessionStorage`.
2.  The frontend makes authenticated API calls to the Node.js/Express backend.
3.  The backend handles all business logic, interacting with the MongoDB database to fetch or save data.
4.  When a user uploads media (posts, stories, profile pictures), the files are sent directly to Cloudinary, and the secure URL is stored in MongoDB.
5.  The app establishes a persistent WebSocket connection with the `socket.io` server for real-time events.
6.  When a user performs an action like sending a message or liking a post, the backend saves the data and then "emits" a real-time event via Socket.IO to the relevant users, updating their UI instantly without a page refresh.

---

## Output

- **React Single-Page Application:**
  - Login/Registration pages with a blurred background effect.
  - A dynamic homepage with a story reel and a personalized post feed.
  - A full-featured profile page with an editable bio, follower/following counts, and a grid of the user's posts.
  - An explore page for discovering new content.
  - A real-time messaging page.
  - A single post view page.

- **REST API:**
  - Endpoints for user authentication, profile management, following/unfollowing, posts, stories, notifications, and messaging.

- **WebSocket Server:**
  - Handles real-time connections for online user status, live notifications, and instant messaging.

---

## Local Setup Instructions

### 1. **Navigate to the Backend and Install Dependencies**

```sh
cd backend
npm install
```
### 2. **Set Up Environment Variables**

- Create a .env file inside the backend directory and add your secret keys:
    - MONGO_URI=your_mongodb_connection_string
    - JWT_SECRET=a_long_random_secret_string
    - CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
    - CLOUDINARY_API_KEY=your_cloudinary_api_key
    - CLOUDINARY_API_SECRET=your_cloudinary_api_secret

### 3. **Run the Backend Server**
- Open a terminal in the backend directory and run:
```sh
npm run dev
```
### 4. **Navigate to the Frontend and Install Dependencies**
- Open a new terminal in the root project folder (murmur/) and run:
```sh
npm install
```
### 5. **Run the Frontend Development Server**
- In the same terminal, run:
```sh
npm run dev
```

---
## API Endpoints
| Endpoint                        | Method | Description                        |
|----------------------------------|--------|------------------------------------|
| `/api/auth/register`                  | POST    | Register new user                   |
| `/api/auth/login`                  | POST   | Log in a user and receive a JWT.                 |
| `/api/users/me`         | DELETE   | Delete the logged-in user's account.            |
| `/api/profile/me`          | GET   | Get the profile of the logged-in user.       |
| `/api/profile/:userId`        | GET    | Get a specific user's profile by ID. |
| `/api/profile/following`        | GET    | Get a list of users the user is following. |
| `/api/profile/suggestions`        | GET    | Get suggested users to follow. |
| `/api/profile/me`        | PUT    | Update the user's name and bio. |
| `/api/profile/follow/:id`        | PUT    | Follow a user by their ID. |
| `/api/profile/unfollow/:id`        | PUT    | Unfollow a user by their ID. |
| `/api/profile/upload`        | POST    | Upload a new profile picture. |
| `/api/posts`        | GET    | Get the personalized homepage feed. |
| `/api/posts/me`        | GET    | Get all posts created by the user. |
| `/api/posts/user/:userId`        | GET    | Get all posts from specific user. |
| `/api/posts/explore`        | GET    | Get posts for the explore page. |
| `/api/posts/:id`        | GET    | Get a single post by its ID. |
| `/api/posts`        | POST   | Create a new post. |
| `/api/posts/comment/:id`        | POST    | Add a comment to a post. |
| `/api/posts/like/:id`        | PUT   | Like a post. |
| `/api/posts/unlike/:id`        | PUT    | Unlike a post. |
| `/api/posts/:id`        | DELETE    | Delete a post. |
| `/api/stories`        | GET    | Get the story feed for the user. |
| `/api/stories`        | POST    | Create a new story. |
| `/api/messages/conversations`        | GET    | Get a list of the user's conversations. |
| `/api/messages/:id`        | GET    | Get all messages for a conversation. |
| `/api/messages/send/:id`        | POST    | Send a text message to a user. |
| `/api/messages/share`        | POST   | Share a post as a message. |
| `/api/notifications`        | GET    | Get all notifications for the user. |
| `/api/notifications/read`        | PUT    | Mark all notifications as read. |
| `/api/media/stream`        | GET    | Public proxy to stream media from a URL. |

---

