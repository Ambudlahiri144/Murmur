import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Flex, Avatar, IconButton, Dialog, Button, TextArea, Text, Callout, Grid, TextField, Spinner, Heading, Progress, Popover, Box, ScrollArea } from '@radix-ui/themes';
import { useDropzone } from 'react-dropzone';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { 
  MagnifyingGlassIcon, 
  HeartIcon, 
  PlusCircledIcon,
  InfoCircledIcon, 
  ImageIcon,
  VideoIcon,
  UploadIcon,
  ArrowLeftIcon,
  FileTextIcon,
  ScissorsIcon
} from '@radix-ui/react-icons';
import { IoChatbubblesOutline, IoChatbubbles } from "react-icons/io5";
import { GoHeart, GoHeartFill } from "react-icons/go";
import axios from 'axios';
import { getProxiedUrl } from '../utils/mediaHelper';
import { useSocket } from '../context/SocketContext';

const NotificationItem = ({ notification }) => {
    const navigate = useNavigate();
    
    if (!notification || !notification.from || !notification.from.name) {
        return null;
    }

    let message = '';
    let link = `/profile/${notification.from._id}`;

    switch (notification.type) {
        case 'like':
            message = 'liked your post.';
            link = `/post/${notification.post?._id}`;
            break;
        case 'comment':
            message = 'commented on your post.';
            link = `/post/${notification.post?._id}`;
            break;
        case 'follow':
            message = 'started following you.';
            break;
        default:
            message = 'sent you a notification.';
    }

    return (
        <Link to={link} className="w-full" onClick={() => {
            const trigger = document.getElementById('notifications-trigger');
            trigger?.click();
        }}>
            <Flex gap="3" align="center" p="2" className="hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                <Avatar src={getProxiedUrl(notification.from.profilePicture)} fallback={notification.from.name.charAt(0).toUpperCase()} radius="full"/>
                <Text size="2">
                    <Text weight="bold">{notification.from.name}</Text> {message}
                </Text>
            </Flex>
        </Link>
    );
};


const TopHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { notifications, setNotifications } = useSocket();
  
  // -- State Management for Modals and Panels --
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState('choice');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  // Post State
  const [postCaption, setPostCaption] = useState('');
  const [postMediaFiles, setPostMediaFiles] = useState([]);
  const [postPreviews, setPostPreviews] = useState([]);
  
  // Story State
  const [storyFile, setStoryFile] = useState(null);
  const [storyPreview, setStoryPreview] = useState(null);

  // Trimmer State
  const [showTrimmer, setShowTrimmer] = useState(false);
  const [untrimmedFile, setUntrimmedFile] = useState(null);
  const [trimmingProgress, setTrimmingProgress] = useState(0);
  const [isTrimming, setIsTrimming] = useState(false);

  // Common State
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [hasUnread, setHasUnread] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const ffmpegRef = useRef(new FFmpeg());
  const API_URL = 'http://localhost:5000';

  // --- Dropzone & Trimmer Logic ---
  const onPostDrop = useCallback(acceptedFiles => {
    const files = acceptedFiles.slice(0, 10);
    setPostMediaFiles(files);
    setPostPreviews(files.map(file => ({ url: URL.createObjectURL(file), type: file.type })));
  }, []);
  const { getRootProps: getPostRootProps, getInputProps: getPostInputProps, isDragActive: isPostDragActive } = useDropzone({ onDrop: onPostDrop, accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif'], 'video/*': ['.mp4', '.mov'] } });

  const onStoryDrop = useCallback(acceptedFiles => {
    const file = acceptedFiles[0];
    if (file) {
      if (file.type.startsWith('video/')) {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = function() {
          window.URL.revokeObjectURL(video.src);
          if (video.duration > 60) {
            setUntrimmedFile(file);
            setShowTrimmer(true);
            setStoryPreview(null);
          } else {
            setStoryFile(file);
            setStoryPreview({ url: URL.createObjectURL(file), type: file.type });
            setShowTrimmer(false);
          }
        }
        video.src = URL.createObjectURL(file);
      } else {
        setStoryFile(file);
        setStoryPreview({ url: URL.createObjectURL(file), type: file.type });
        setShowTrimmer(false);
      }
    }
  }, []);
  const { getRootProps: getStoryRootProps, getInputProps: getStoryInputProps, isDragActive: isStoryDragActive } = useDropzone({ onDrop: onStoryDrop, accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif'], 'video/*': ['.mp4', '.mov'] }, maxFiles: 1 });

  const handleTrim = async () => {
    setIsTrimming(true);
    setTrimmingProgress(0);
    const ffmpeg = ffmpegRef.current;
    ffmpeg.on('log', ({ message }) => {});
    ffmpeg.on('progress', ({ progress }) => { setTrimmingProgress(Math.round(progress * 100)); });
    await ffmpeg.load();
    await ffmpeg.writeFile('input.mp4', await fetchFile(untrimmedFile));
    await ffmpeg.exec(['-i', 'input.mp4', '-t', '60', '-c', 'copy', 'output.mp4']);
    const data = await ffmpeg.readFile('output.mp4');
    const blob = new Blob([data.buffer], { type: 'video/mp4' });
    const trimmedFile = new File([blob], untrimmedFile.name, { type: 'video/mp4' });
    setStoryFile(trimmedFile);
    setStoryPreview({ url: URL.createObjectURL(trimmedFile), type: 'video/mp4' });
    setShowTrimmer(false);
    setIsTrimming(false);
  };
  
  // --- API Handlers ---
  const handleCreatePost = async () => {
    if (postMediaFiles.length === 0) { setError('Please select at least one file.'); return; }
    setLoading(true); setError('');
    const formData = new FormData();
    postMediaFiles.forEach(file => formData.append('postMedia', file));
    formData.append('caption', postCaption);
    const token = sessionStorage.getItem('token');
    const config = { headers: { 'Content-Type': 'multipart/form-data', 'x-auth-token': token } };
    try {
      await axios.post(`${API_URL}/api/posts`, formData, config);
      handleModalChange(false);
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to create post.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStory = async () => {
    if (!storyFile) { setError('Please select a file for your story.'); return; }
    setLoading(true); setError('');
    const formData = new FormData();
    formData.append('storyMedia', storyFile);
    const token = sessionStorage.getItem('token');
    const config = { headers: { 'Content-Type': 'multipart/form-data', 'x-auth-token': token } };
    try {
      await axios.post(`${API_URL}/api/stories`, formData, config);
      handleModalChange(false);
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to create story.');
    } finally {
      setLoading(false);
    }
  };

  // --- Modal & State Management ---
  const handleModalChange = (open) => {
    if (!open) {
      setModalContent('choice');
      setPostCaption('');
      setPostMediaFiles([]);
      setPostPreviews([]);
      setStoryFile(null);
      setStoryPreview(null);
      setShowTrimmer(false);
      setUntrimmedFile(null);
      setError('');
    }
    setIsModalOpen(open);
  };
  
  // Debounced search effect
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      setIsSearchOpen(false);
      return;
    }
    const search = async () => {
      setSearchLoading(true);
      const token = sessionStorage.getItem('token');
      const config = { headers: { 'x-auth-token': token } };
      try {
        const res = await axios.get(`${API_URL}/api/profile/search?q=${searchQuery}`, config);
        setSearchResults(res.data);
        setIsSearchOpen(true);
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setSearchLoading(false);
      }
    };
    const debounceTimeout = setTimeout(search, 300);
    return () => clearTimeout(debounceTimeout);
  }, [searchQuery]);
  
  // Effect to fetch user data for the avatar
  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = sessionStorage.getItem('token');
      if (!token) return;
      const config = { headers: { 'x-auth-token': token } };
      try {
        const res = await axios.get(`${API_URL}/api/profile/me`, config);
        setProfile(res.data);
      } catch (err) {
        console.error("Failed to fetch user profile for header", err);
      }
    };
    fetchUserProfile();
  }, []);

  // Effect for notifications
  useEffect(() => {
    if(notifications) {
      const unread = notifications.some(n => !n.read);
      setHasUnread(unread);
    }
  }, [notifications]);

  const handleNotificationsOpen = async (open) => {
    setIsNotificationsOpen(open);
    if (open && hasUnread) {
        const token = sessionStorage.getItem('token');
        const config = { headers: { 'x-auth-token': token } };
        try {
            await axios.put(`${API_URL}/api/notifications/read`, {}, config);
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setHasUnread(false);
        } catch (err) {
            console.error("Failed to mark notifications as read", err);
        }
    }
  };


  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-30 bg-white/60 dark:bg-murmur-dark/30 backdrop-blur-md left-20 xl:left-72">
        <Flex align="center" justify="between" className="h-full px-6 py-3">
          

          <Flex justify="center" className="w-1/2">
            <Popover.Root open={isSearchOpen} onOpenChange={setIsSearchOpen}>
              <Popover.Anchor>
                <TextField.Root
                  placeholder="Search"
                  className="max-w-xs w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => { if (searchQuery) setIsSearchOpen(true) }}
                >
                    <TextField.Slot>
                        <MagnifyingGlassIcon height="16" width="16" className="text-icon-color" />
                    </TextField.Slot>
                </TextField.Root>
              </Popover.Anchor>
              <Popover.Content style={{ width: 360 }}>
                <Flex direction="column" gap="3">
                  {searchLoading && <Flex justify="center" p="4"><Spinner/></Flex>}
                  {!searchLoading && searchResults.length > 0 && searchResults.map(user => (
                      <Link to={`/profile/${user._id}`} key={user._id} onClick={() => {setSearchQuery(''); setIsSearchOpen(false);}}>
                          <Flex align="center" gap="3" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                              <Avatar src={getProxiedUrl(user.profilePicture)} fallback={user.name.charAt(0).toUpperCase()} radius="full" />
                              <Text>{user.name}</Text>
                          </Flex>
                      </Link>
                  ))}
                  {!searchLoading && searchQuery && searchResults.length === 0 && (
                      <Text color="gray" align="center" p="4">No results found for "{searchQuery}"</Text>
                  )}
                </Flex>
              </Popover.Content>
            </Popover.Root>
          </Flex>

          <Flex justify="end" align="center" className="w-1/4" gap="4">
            <IconButton variant="ghost" size="3" className="cursor-pointer text-icon-color" onClick={() => setIsModalOpen(true)}>
              <PlusCircledIcon height="24" width="24" />
            </IconButton>
            <IconButton variant="ghost" size="3" className="cursor-pointer text-icon-color" onClick={() => navigate('/messages')}>
              {location.pathname === '/messages' ? <IoChatbubbles size={24} /> : <IoChatbubblesOutline size={24} />}
            </IconButton>
            
            <Popover.Root onOpenChange={handleNotificationsOpen}>
                <Popover.Trigger>
                    <IconButton variant="ghost" size="3" className="cursor-pointer relative text-icon-color" id="notifications-trigger">
                        {hasUnread && <Box className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full" />}
                        {isNotificationsOpen ? <GoHeartFill size={24} /> : <GoHeart size={24} />}
                    </IconButton>
                </Popover.Trigger>
                <Popover.Content style={{ width: 360 }}>
                    <Heading size="4" mb="2">Notifications</Heading>
                    <ScrollArea type="auto" scrollbars="vertical" style={{ maxHeight: 400 }}>
                        <Flex direction="column" gap="2">
                            {notifications && notifications.length > 0 ? (
                                notifications.map(n => <NotificationItem key={n._id} notification={n} />)
                            ) : (
                                <Text color="gray" size="2" align="center" p="4">No new notifications.</Text>
                            )}
                        </Flex>
                    </ScrollArea>
                </Popover.Content>
            </Popover.Root>
            <div onClick={() => navigate('/profile')} className="cursor-pointer">
                <Avatar 
                  size="3" 
                  radius="full" 
                  fallback={profile ? profile.name.charAt(0).toUpperCase() : '?'} 
                  src={getProxiedUrl(profile?.profilePicture)}
                />
            </div>
          </Flex>
        </Flex>
      </header>
      
      <Dialog.Root open={isModalOpen} onOpenChange={handleModalChange}>
        <Dialog.Content style={{ maxWidth: 550 }}>
          {(modalContent !== 'choice' && !showTrimmer) && (
            <IconButton variant="ghost" onClick={() => setModalContent('choice')} className="!absolute top-3 left-3 z-10">
              <ArrowLeftIcon/>
            </IconButton>
          )}

          {modalContent === 'choice' && (
            <>
              <Dialog.Title align="center">Create</Dialog.Title>
              <Flex direction="column" gap="3" mt="4">
                  <Button size="3" variant="outline" onClick={() => setModalContent('post')}><FileTextIcon/> Create Post</Button>
                  <Button size="3" variant="outline" onClick={() => setModalContent('story')}><PlusCircledIcon/> Create Story</Button>
              </Flex>
            </>
          )}

          {modalContent === 'post' && (
            <>
              <Dialog.Title>Create New Post</Dialog.Title>
              <Dialog.Description size="2" mb="4">Select up to 10 images or videos.</Dialog.Description>
              {error && <Callout.Root color="red" role="alert" my="3"><Callout.Icon><InfoCircledIcon /></Callout.Icon><Callout.Text>{error}</Callout.Text></Callout.Root>}
              <Flex direction="column" gap="3">
                {postPreviews.length > 0 ? <Grid columns="3" gap="2" width="auto">{postPreviews.map((p, i) => <div key={i} className="relative w-full h-32">{p.type.startsWith('image') ? <img src={p.url} alt="" className="w-full h-full object-cover rounded-md"/> : <video src={p.url} className="w-full h-full object-cover rounded-md" loop muted/>}</div>)}</Grid> : <div {...getPostRootProps()} className={`w-full h-64 flex items-center justify-center cursor-pointer border-2 border-dashed rounded-md ${isPostDragActive ? 'border-cyan-500 bg-cyan-500/10' : 'dark:border-gray-600 bg-gray-100 dark:bg-gray-800'}`}><input {...getPostInputProps()} /><Flex direction="column" align="center" gap="2"><UploadIcon width="50" height="50" className="text-gray-500"/><Text>Drag & drop or click to select</Text></Flex></div>}
                <TextArea value={postCaption} onChange={(e) => setPostCaption(e.target.value)} placeholder="Write a caption..."/>
              </Flex>
              <Flex gap="3" mt="4" justify="end"><Button variant="soft" color="gray" onClick={() => handleModalChange(false)}>Cancel</Button><Button onClick={handleCreatePost} disabled={loading}>{loading ? 'Posting...' : 'Post'}</Button></Flex>
            </>
          )}

          {modalContent === 'story' && (
             <>
              <Dialog.Title>Create New Story</Dialog.Title>
              {error && <Callout.Root color="red" role="alert" my="3"><Callout.Icon><InfoCircledIcon /></Callout.Icon><Callout.Text>{error}</Callout.Text></Callout.Root>}
              
              {showTrimmer ? (
                <Flex direction="column" gap="3" my="4">
                    <Text as="p" color="gray" size="2">This video is longer than 60 seconds.</Text>
                    <video src={URL.createObjectURL(untrimmedFile)} className="w-full rounded-md" controls/>
                    {isTrimming && <Progress value={trimmingProgress} />}
                    <Button onClick={handleTrim} disabled={isTrimming}><ScissorsIcon/> {isTrimming ? `Trimming... ${trimmingProgress}%` : 'Trim to first 60 seconds'}</Button>
                </Flex>
              ) : (
                <Flex direction="column" gap="3">
                  {storyPreview ? <div className="w-full h-80">{storyPreview.type.startsWith('image') ? <img src={storyPreview.url} alt="Story preview" className="w-full h-full object-contain rounded-md"/> : <video src={storyPreview.url} className="w-full h-full object-contain rounded-md" autoPlay loop muted/>}</div> : <div {...getStoryRootProps()} className={`w-full h-80 flex items-center justify-center cursor-pointer border-2 border-dashed rounded-md ${isStoryDragActive ? 'border-cyan-500 bg-cyan-500/10' : 'dark:border-gray-600 bg-gray-100 dark:bg-gray-800'}`}><input {...getStoryInputProps()} /><Flex direction="column" align="center" gap="2"><UploadIcon width="50" height="50" className="text-gray-500"/><Text>Drag & drop or click to select</Text></Flex></div>}
                </Flex>
              )}

              <Flex gap="3" mt="4" justify="end">
                <Button variant="soft" color="gray" onClick={() => handleModalChange(false)}>Cancel</Button>
                <Button onClick={handleCreateStory} disabled={loading || showTrimmer || isTrimming}>{loading ? 'Adding...' : 'Add to Story'}</Button>
              </Flex>
            </>
          )}
        </Dialog.Content>
      </Dialog.Root>
    </>
  );
};

export default TopHeader;
