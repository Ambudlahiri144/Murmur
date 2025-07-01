import React, { useState, useEffect, useRef } from 'react';
import { Flex, Avatar, Text, TextField, IconButton, Box, Card, Button } from '@radix-ui/themes';
import { PaperPlaneIcon, Link2Icon } from '@radix-ui/react-icons';
import { getProxiedUrl } from '../utils/mediaHelper';
import { Link } from 'react-router-dom';

const Message = ({ message, isOwnMessage, profilePicture }) => {
    const messageBoxClasses = `p-2 rounded-lg max-w-xs md:max-w-md ${isOwnMessage ? 'bg-cyan-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`;

    // --- Render a Shared Post ---
    if (message.messageType === 'post' && message.post) {
        const post = message.post;
        const firstMedia = post.media?.[0];
        
        return (
            <Flex gap="3" my="1" direction={isOwnMessage ? "row-reverse" : "row"}>
                 {!isOwnMessage && <Avatar size="2" radius="full" fallback="?" src={getProxiedUrl(profilePicture)} />}
                <Card className={messageBoxClasses} style={{padding: '0.5rem', width: '280px'}}>
                    <Text size="1" as="p" className="mb-2 opacity-80">{isOwnMessage ? "You shared a post" : "Shared a post"}</Text>
                    <Flex gap="3" align="center">
                        {firstMedia && (
                            <img src={getProxiedUrl(firstMedia.url)} className="w-16 h-16 object-cover rounded-md" />
                        )}
                        <Flex direction="column">
                            <Text weight="bold" size="2">@{post.user?.name || 'User'}</Text>
                            <Text size="2" trim="start" as="p" className="opacity-90 truncate">{post.caption}</Text>
                             {/* The fix is here: Link now points to the post's direct page */}
                             <Link to={`/post/${post._id}`}>
                                <Button size="1" variant="soft" mt="2" highContrast>
                                    <Link2Icon/> View Post
                                </Button>
                            </Link>
                        </Flex>
                    </Flex>
                </Card>
            </Flex>
        );
    }
    
    // --- Render a Text Message ---
    return (
        <Flex gap="3" my="1" direction={isOwnMessage ? "row-reverse" : "row"}>
            {!isOwnMessage && (
                <Avatar size="2" radius="full" fallback="?" src={getProxiedUrl(profilePicture)} />
            )}
            <Box className={messageBoxClasses}>
                <Text size="2">{message.message}</Text>
            </Box>
        </Flex>
    );
};

const ChatWindow = ({ selectedUser, messages, onSendMessage, currentUserId }) => {
    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (newMessage.trim()) {
            onSendMessage(newMessage);
            setNewMessage("");
        }
    };

    if (!selectedUser) return null;

    return (
        <Flex direction="column" className="h-full">
            {/* Chat Header */}
            <Flex align="center" gap="3" p="3" className="border-b border-gray-200 dark:border-gray-700">
                <Avatar size="3" radius="full" fallback={selectedUser.name.charAt(0).toUpperCase()} src={getProxiedUrl(selectedUser.profilePicture)} />
                <Text weight="bold">{selectedUser.name}</Text>
            </Flex>

            {/* Messages Area */}
            <div className="flex-grow p-4 overflow-y-auto">
                {messages.map((msg, index) => (
                    <Message 
                        key={msg._id || index} // Use index as a fallback key
                        message={msg}
                        isOwnMessage={msg.sender === currentUserId}
                        profilePicture={selectedUser.profilePicture}
                    />
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700">
                <Flex align="center" gap="3">
                    <TextField.Root 
                        placeholder="Type a message..." 
                        className="flex-grow"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <IconButton type="submit" size="2" className="cursor-pointer">
                        <PaperPlaneIcon />
                    </IconButton>
                </Flex>
            </form>
        </Flex>
    );
};

export default ChatWindow;
