import React, { useState, useEffect, useRef } from 'react';
import { Flex, Heading, Text, Spinner,IconButton } from '@radix-ui/themes';
import Sidebar from '../components/Sidebar';
import TopHeader from '../components/TopHeader';
import Conversation from '../components/Conversation';
import ChatWindow from '../components/ChatWindow';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Pencil2Icon } from '@radix-ui/react-icons';
import { IoChatbubblesOutline } from "react-icons/io5";

const Messages = () => {
  const [followingList, setFollowingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  
  const socket = useRef();
  const API_URL = 'http://localhost:5000';

  // Effect for Socket.IO connection and events
  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (!token) return;

    const userId = JSON.parse(atob(token.split('.')[1])).user.id;
    setCurrentUserId(userId);
    
    socket.current = io(API_URL, { query: { userId } });
    socket.current.on("getOnlineUsers", (users) => setOnlineUsers(users));
    
    socket.current.on("newMessage", (newMessage) => {
        // Only add the message if it belongs to the currently selected chat
        if (selectedUser?._id === newMessage.sender) {
            setMessages(prev => [...prev, newMessage]);
        }
    });

    return () => socket.current.disconnect();
  }, [selectedUser]); // Re-run effect if selectedUser changes to correctly handle incoming messages

  // Effect to fetch the list of users you follow
  useEffect(() => {
    const fetchFollowing = async () => {
        setLoading(true);
        const token = sessionStorage.getItem('token');
        if (!token) { setLoading(false); return; }
        const config = { headers: { 'x-auth-token': token } };
        try {
            const res = await axios.get(`${API_URL}/api/profile/following`, config);
            setFollowingList(res.data);
        } catch (err) {
            console.error("Failed to fetch following list", err);
        } finally {
            setLoading(false);
        }
    };
    fetchFollowing();
  }, []);

  // Effect to fetch messages when a user is selected
  useEffect(() => {
    const getMessages = async () => {
        if (!selectedUser) return;
        setMessages([]); // Clear previous messages
        const token = sessionStorage.getItem('token');
        const config = { headers: { 'x-auth-token': token } };
        try {
            const res = await axios.get(`${API_URL}/api/messages/${selectedUser._id}`, config);
            setMessages(res.data);
        } catch (err) {
            console.error("Failed to get messages", err);
        }
    };
    getMessages();
  }, [selectedUser]);

  const handleSendMessage = async (message) => {
    const token = sessionStorage.getItem('token');
    const config = { headers: { 'x-auth-token': token } };
    try {
        const res = await axios.post(`${API_URL}/api/messages/send/${selectedUser._id}`, { message }, config);
        setMessages([...messages, res.data]);
    } catch (err) {
        console.error("Failed to send message", err);
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-murmur-dark min-h-screen">
      <TopHeader />
      <Sidebar />
      <main className="pt-20 pl-24 xl:pl-72">
        <div className="h-[calc(100vh-5rem)] border-t border-gray-200 dark:border-gray-700">
            <Flex className="h-full">
                <Flex direction="column" className="w-full md:w-1/3 border-r border-gray-200 dark:border-gray-700">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <Heading as="h2" size="6">{currentUser?.name || 'Messages'}</Heading>
                        
                    </div>
                    <div className="flex-grow p-2 overflow-y-auto">
                        {loading ? <Flex justify="center" p="4"><Spinner/></Flex> : 
                            followingList.map(user => (
                                <Conversation 
                                    key={user._id} 
                                    user={user}
                                    isOnline={onlineUsers.includes(user._id)}
                                    onClick={setSelectedUser}
                                />
                            ))
                        }
                    </div>
                </Flex>

                <Flex direction="column" className="hidden md:flex flex-grow">
                   {selectedUser ? (
                       <ChatWindow 
                           selectedUser={selectedUser} 
                           messages={messages}
                           onSendMessage={handleSendMessage}
                           currentUserId={currentUserId}
                       />
                   ) : (
                       <div className="flex-grow flex flex-col gap-2 items-center justify-center">
                            <div className="w-24 h-24 border-2 border-black dark:border-white rounded-full flex items-center justify-center">
                                <IoChatbubblesOutline size={50} />
                            </div>
                            <Heading>Your Messages</Heading>
                            <Text color="gray">Send private photos and messages to a friend.</Text>
                       </div>
                   )}
                </Flex>
            </Flex>
        </div>
      </main>
    </div>
  );
};

export default Messages;
