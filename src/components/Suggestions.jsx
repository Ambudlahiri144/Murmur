import React, { useState, useEffect } from 'react';
import { Flex, Avatar, Text, Button, Spinner, Dialog } from '@radix-ui/themes';
import axios from 'axios';
import { getProxiedUrl } from '../utils/mediaHelper'; // <-- 1. Import the helper

// A reusable component for a single suggestion item
const SuggestionItem = ({ user, onFollowToggle, isFollowing }) => {
    return (
        <Flex align="center" justify="between">
            <Flex align="center" gap="3">
                <Avatar
                    size="3"
                    radius="full"
                    fallback={user.name.charAt(0).toUpperCase()}
                    // 2. Use the proxied URL for the avatar
                    src={getProxiedUrl(user.profilePicture)}
                />
                <div>
                    <Text size="2" weight="bold">{user.name}</Text>
                    <Text size="1" color="gray" as="p">New to Murmur</Text>
                </div>
            </Flex>
            <Button 
                variant={isFollowing ? "soft" : "ghost"} 
                size="1" 
                className={!isFollowing ? "text-icon-color cursor-pointer" : "text-icon-color bg-transparent cursor-pointer"}
                onClick={() => onFollowToggle(user._id, isFollowing)}
            >
                {isFollowing ? "Following" : "Follow"}
            </Button>
        </Flex>
    );
};


const Suggestions = () => {
  const [initialSuggestions, setInitialSuggestions] = useState([]);
  const [allSuggestions, setAllSuggestions] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingModal, setLoadingModal] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const API_URL = import.meta.env.VITE_API_URL;

  const fetchData = async (limit = 3, forModal = false) => {
      if (forModal) setLoadingModal(true);
      else setLoadingInitial(true);

      const token = sessionStorage.getItem('token');
      if (!token) {
        setLoadingInitial(false);
        setLoadingModal(false);
        return;
      }
      const config = { headers: { 'x-auth-token': token } };

      try {
        const [suggestionsRes, currentUserRes] = await Promise.all([
          axios.get(`${API_URL}/api/profile/suggestions?limit=${limit}`, config),
          axios.get(`${API_URL}/api/profile/me`, config)
        ]);
        
        if(forModal) {
            setAllSuggestions(suggestionsRes.data);
        } else {
            setInitialSuggestions(suggestionsRes.data);
        }
        setCurrentUser(currentUserRes.data);

      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        setLoadingInitial(false);
        setLoadingModal(false);
      }
  };

  useEffect(() => {
    fetchData(3, false);
  }, []);

  const handleOpenModal = () => {
    setIsModalOpen(true);
    fetchData(10, true);
  };

  const handleFollowToggle = async (userId, isCurrentlyFollowing) => {
      // 3. This is now correctly using sessionStorage
      const token = sessionStorage.getItem('token');
      const config = { headers: { 'x-auth-token': token } };
      const action = isCurrentlyFollowing ? 'unfollow' : 'follow';
      
      try {
          await axios.put(`${API_URL}/api/profile/${action}/${userId}`, {}, config);
          // Refresh data to show updated follow status
          fetchData(isModalOpen ? 10 : 3, isModalOpen);
      } catch (err) {
          console.error(`Failed to ${action} user`, err);
      }
  };

  const isFollowing = (userId) => {
      return currentUser?.following.some(f => f.user === userId);
  }

  return (
    <>
        <Flex direction="column" gap="4" className="bg-bg-black/60 dark:bg-black/30 p-4 rounded-lg">
            <Flex align="center" justify="between">
                <Text size="2" weight="bold" color="white" >Suggestions for you</Text>
                <Text 
                    size="2" 
                    weight="bold" 
                    className="cursor-pointer hover:underline" 
                    onClick={handleOpenModal}
                >
                    See All
                </Text>
            </Flex>

            {loadingInitial ? (
                <Flex justify="center" p="4"><Spinner /></Flex>
            ) : (
                initialSuggestions.map(user => (
                    <SuggestionItem 
                        key={user._id} 
                        user={user} 
                        isFollowing={isFollowing(user._id)}
                        onFollowToggle={handleFollowToggle}
                    />
                ))
            )}
        </Flex>

        <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
            <Dialog.Content style={{ maxWidth: 450 }}>
                <Dialog.Title>Suggestions</Dialog.Title>
                
                {loadingModal ? (
                    <Flex justify="center" p="6"><Spinner /></Flex>
                ) : (
                    <Flex direction="column" gap="4" mt="4">
                        {allSuggestions.map(user => (
                           <SuggestionItem 
                                key={user._id} 
                                user={user}
                                isFollowing={isFollowing(user._id)}
                                onFollowToggle={handleFollowToggle}
                           />
                        ))}
                    </Flex>
                )}
                
                <Flex gap="3" mt="4" justify="end">
                    <Dialog.Close>
                        <Button variant="soft" color="gray">Close</Button>
                    </Dialog.Close>
                </Flex>
            </Dialog.Content>
        </Dialog.Root>
    </>
  );
};

export default Suggestions;
