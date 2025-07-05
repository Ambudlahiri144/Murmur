import React, { useState, useEffect, useRef } from 'react';
import { Flex, Avatar, Text, Dialog, IconButton, Progress } from '@radix-ui/themes';
import { Cross1Icon, ChevronLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons';
import axios from 'axios';
import { getProxiedUrl } from '../utils/mediaHelper';

// --- Story Viewer Component (The Full-Screen Modal) ---
const StoryViewer = ({ userStories, onClose }) => {
    const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
    const [storyDuration, setStoryDuration] = useState(5000); // Default 5s for images
    
    const videoRef = useRef(null);

    useEffect(() => {
        if (!userStories || userStories.stories.length === 0) {
            onClose();
            return;
        }

        const activeStory = userStories.stories[currentStoryIndex];
        let duration = 5000;

        if (activeStory.media.mediaType === 'video' && videoRef.current) {
            const videoElement = videoRef.current;
            const handleDuration = () => {
                duration = Math.min(videoElement.duration * 1000, 60000);
                setStoryDuration(duration);
            };
            videoElement.addEventListener('loadedmetadata', handleDuration);
            if(videoElement.readyState >= 1) {
                handleDuration();
            }
        } else {
            setStoryDuration(5000);
        }
        
        const timer = setTimeout(() => {
            handleNextStory();
        }, storyDuration);

        return () => {
            clearTimeout(timer);
            if(videoRef.current) {
                videoRef.current.removeEventListener('loadedmetadata', () => {});
            }
        };
    }, [currentStoryIndex, userStories]);

    const handleNextStory = () => {
        if (currentStoryIndex < userStories.stories.length - 1) {
            setCurrentStoryIndex(currentStoryIndex + 1);
        } else {
            onClose(); 
        }
    };

    const handlePrevStory = () => {
        if (currentStoryIndex > 0) {
            setCurrentStoryIndex(currentStoryIndex - 1);
        }
    };

    if (!userStories || userStories.stories.length === 0) return null;

    const activeStory = userStories.stories[currentStoryIndex];

    return (
        <Dialog.Content className="!p-0 !m-0 !max-w-md bg-black">
            <div className="relative h-screen flex items-center justify-center">
                <IconButton onClick={onClose} variant="ghost" className="!absolute top-4 right-4 z-50 text-white !cursor-pointer ">
                    <Cross1Icon width="24" height="24"/>
                </IconButton>

                <div className="relative w-full h-full">
                    {activeStory.media.mediaType === 'image' ? (
                        <img src={getProxiedUrl(activeStory.media.url)} className="w-full h-full object-contain" alt="Story content" />
                    ) : (
                        <video ref={videoRef} src={getProxiedUrl(activeStory.media.url)} className="w-full h-full object-contain" autoPlay onEnded={handleNextStory} />
                    )}
                </div>

                <div className="!absolute top-0 left-0 right-0 p-4 z-40 bg-gradient-to-b from-black/50 to-transparent">
                    <Flex gap="1" mb="2">
                        {userStories.stories.map((_, index) => (
                           <div key={index} className="flex-1 h-1 bg-white/30 rounded-full">
                               <div 
                                    className={`h-full bg-white rounded-full ${index < currentStoryIndex ? 'w-full' : ''} ${index === currentStoryIndex ? 'animate-progress' : ''}`} 
                                    style={{ animationDuration: `${storyDuration}ms` }}
                                ></div>
                           </div>
                        ))}
                    </Flex>
                    <Flex align="center" gap="3">
                        <Avatar src={getProxiedUrl(userStories.userAvatar)} fallback={userStories.username.charAt(0)} radius="full" size="2" />
                        <Text weight="bold" size="2" className="text-white">{userStories.username}</Text>
                    </Flex>
                </div>
                
                {currentStoryIndex > 0 && (
                    <IconButton onClick={handlePrevStory} size="2" radius="full" className="!absolute top-1/2 left-2 -translate-y-1/2 !bg-white/30 hover:!bg-white/50 z-50">
                        <ChevronLeftIcon/>
                    </IconButton>
                )}
                {currentStoryIndex < userStories.stories.length - 1 && (
                     <IconButton onClick={handleNextStory} size="2" radius="full" className="!absolute top-1/2 right-2 -translate-y-1/2 !bg-white/30 hover:!bg-white/50 z-50">
                        <ChevronRightIcon/>
                    </IconButton>
                )}
            </div>
        </Dialog.Content>
    );
};


// --- Story Reel Component (The Horizontal Bar) ---
const StoryReel = () => {
    const [storyFeed, setStoryFeed] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUserStories, setSelectedUserStories] = useState(null);
    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const fetchStoryFeed = async () => {
            const token = sessionStorage.getItem('token');
            if (!token) { setLoading(false); return; }
            const config = { headers: { 'x-auth-token': token } };

            try {
                const res = await axios.get(`${API_URL}/api/stories`, config);
                setStoryFeed(res.data);
            } catch (err) {
                console.error("Failed to fetch story feed", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStoryFeed();
    }, []);

    const handleStoryClick = (userStories) => {
        setSelectedUserStories(userStories);
        setIsViewerOpen(true);
    };

    return (
        <>
            <Flex align="center" gap="4" p="4" className="bg-white dark:bg-transparent rounded-lg overflow-x-auto">
                {loading ? <Text>Loading stories...</Text> : storyFeed.map(userStories => (
                    <Flex key={userStories.userId} direction="column" align="center" gap="1" className="cursor-pointer" onClick={() => handleStoryClick(userStories)}>
                        <div className="p-1 rounded-full bg-icon-color">
                            <Avatar
                                src={getProxiedUrl(userStories.userAvatar)}
                                fallback={userStories.username.charAt(0).toUpperCase()}
                                size="5"
                                radius="full"
                                className="border-2 border-white dark:border-gray-800"
                            />
                        </div>
                        <Text size="1" className="w-16 truncate text-center">{userStories.username}</Text>
                    </Flex>
                ))}
            </Flex>

            <Dialog.Root open={isViewerOpen} onOpenChange={setIsViewerOpen}>
                {selectedUserStories && <StoryViewer userStories={selectedUserStories} onClose={() => setIsViewerOpen(false)} />}
            </Dialog.Root>
        </>
    );
};

export default StoryReel;
