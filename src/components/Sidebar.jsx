import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Flex, Avatar, IconButton, Dialog, Button, TextArea, Text, Callout, Grid, TextField, Spinner, Heading, Progress, DropdownMenu, AlertDialog,ScrollArea } from '@radix-ui/themes';
import { useDropzone } from 'react-dropzone';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import {  
  PlusCircledIcon,
  HamburgerMenuIcon,
  ExitIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ArrowLeftIcon,
  InfoCircledIcon, 
  ImageIcon,
  VideoIcon,
  UploadIcon,
  FileTextIcon,
  ScissorsIcon
} from '@radix-ui/react-icons';
import { FaRegCompass } from "react-icons/fa6";
import { BiSolidCompass } from "react-icons/bi";
import { GoHome,GoHomeFill } from "react-icons/go";
import { BiMessageSquareAdd } from "react-icons/bi";
import axios from 'axios';
import { getProxiedUrl } from '../utils/mediaHelper';
import logo from '../assets/logo.png';
import logoSm from '../assets/logo_sm.png';
import { useTheme } from '../context/ThemeContext'; // <-- Import the theme hook
import { MoonIcon, SunIcon } from '@radix-ui/react-icons';


// Reusable Nav Item component
const NavItem = ({ icon, text, onClick, isActive, isCollapsed }) => (
  <Flex 
    align="center" 
    gap="4" 
    p="3" 
    className={`cursor-pointer rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 ${isActive ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
    onClick={onClick}
  >
    {icon}
    <Text size="3" weight={isActive ? "bold" : "regular"} className={`whitespace-nowrap transition-opacity duration-300 ${!isCollapsed ? 'hidden xl:block':'xl:opacity-0 xl:w-0' } font-elsie`}>{text}</Text>
  </Flex>
);
const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme(); // <-- Use the context

  
  // --- State Management ---
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState('choice');
  const [isSearchPanelOpen, setIsSearchPanelOpen] = useState(false);
  
  // Post & Story State
  const [postCaption, setPostCaption] = useState('');
  const [postMediaFiles, setPostMediaFiles] = useState([]);
  const [postPreviews, setPostPreviews] = useState([]);
  const [storyFile, setStoryFile] = useState(null);
  const [storyPreview, setStoryPreview] = useState(null);

  // Trimmer State
  const [showTrimmer, setShowTrimmer] = useState(false);
  const [untrimmedFile, setUntrimmedFile] = useState(null);
  const [trimmingProgress, setTrimmingProgress] = useState(0);
  const [isTrimming, setIsTrimming] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Common State
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);

  const isMessagesPage = location.pathname.startsWith('/messages');
  const isCollapsed = isSearchPanelOpen || isMessagesPage;
  
  const ffmpegRef = useRef(new FFmpeg());
  const API_URL = 'http://localhost:5000';

  // --- Search Logic ---
  useEffect(() => {
    const search = async () => {
      if (searchQuery.trim() === '') {
        setSearchResults([]);
        return;
      }
      setSearchLoading(true);
      const token = sessionStorage.getItem('token');
      const config = { headers: { 'x-auth-token': token } };
      try {
        const res = await axios.get(`http://localhost:5000/api/profile/search?q=${searchQuery}`, config);
        setSearchResults(res.data);
      } catch (err) { console.error("Search failed", err); } 
      finally { setSearchLoading(false); }
    };
    const debounceTimeout = setTimeout(search, 300);
    return () => clearTimeout(debounceTimeout);
  }, [searchQuery]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = sessionStorage.getItem('token');
      if (!token) return;
      const config = { headers: { 'x-auth-token': token } };
      try {
        const res = await axios.get(`http://localhost:5000/api/profile/me`, config);
        setProfile(res.data);
      } catch (err) { console.error("Failed to fetch user profile", err); }
    };
    fetchUserProfile();
  }, []);

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
  
  // --- Account Actions ---
  const handleSignOut = () => {
    sessionStorage.removeItem('token');
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    const token = sessionStorage.getItem('token');
    const config = { headers: { 'x-auth-token': token } };
    try {
        await axios.delete('http://localhost:5000/api/users/me', config);
        handleSignOut();
    } catch (err) {
        console.error("Failed to delete account", err);
    }
  };
  const handleSearchToggle = () => {
    setIsSearchPanelOpen(!isSearchPanelOpen);
    if (isSearchPanelOpen) {
        setSearchQuery(''); // Clear search when closing
    }
  };
  
  return (
    <>
      <aside className={`fixed top-0 left-0 h-screen z-40 bg-white/60 dark:bg-transparent/60 backdrop-blur border-r border-gray-200 dark:border-gray-800 p-4 transition-all duration-300 ${isCollapsed ? 'w-24' : 'w-24 xl:w-72'}`}>
        <Flex direction="column" justify="between" className="h-full">
          <Flex direction="column" gap="2">
            <div className="h-16 flex items-center pl-3 mb-4 cursor-pointer" onClick={() => navigate('/home')}>
              <img src={logo} alt="Murmur Logo" className={`object-contain transition-all duration-300 ${isCollapsed ? 'hidden' : 'h-20 w-50 hidden xl:block'}`} />
              <img src={logoSm} alt="Murmur small Logo" className={`object-contain transition-all duration-300 ${isCollapsed ? 'h-16 w-16' : 'hidden'}`} />
              <Text size="6" className={`font-bold block transition-all duration-300 ${isCollapsed ? 'xl:hidden' : 'xl:hidden'}`}>M</Text>
            </div>
            
            <NavItem icon={<IconButton variant="ghost" size="3" className="cursor-pointer text-icon-color">{location.pathname === '/home' ? <GoHomeFill size={28} /> : <GoHome size={28} />}</IconButton>} text="Home" onClick={() => navigate('/home')} isActive={location.pathname === '/home'} isCollapsed={isCollapsed} />
            <NavItem icon={<IconButton variant="ghost" size="3" className="cursor-pointer text-icon-color"><MagnifyingGlassIcon height="28" width="28" /></IconButton>} text="Search" onClick={() => setIsSearchPanelOpen(!isSearchPanelOpen)} isActive={isSearchPanelOpen} isCollapsed={isCollapsed} />
            <NavItem icon={<IconButton variant="ghost" size="3" className="cursor-pointer text-icon-color">{location.pathname === '/explore' ? <BiSolidCompass size={28} /> : <FaRegCompass size={28} />}</IconButton>} text="Explore" onClick={() => navigate('/explore')} isActive={location.pathname === '/explore'} isCollapsed={isCollapsed} />
            <NavItem icon={<IconButton variant="ghost" size="3" className="cursor-pointer text-icon-color"><BiMessageSquareAdd size={28} /></IconButton>} text="Create" onClick={() => setIsModalOpen(true)} isCollapsed={isCollapsed} />
             <NavItem 
              icon={<Avatar size="2" radius="full" fallback={profile ? profile.name.charAt(0).toUpperCase() : '?'} src={getProxiedUrl(profile?.profilePicture)} />} 
              text="Profile" 
              onClick={() => navigate('/profile')}
              isActive={location.pathname.startsWith('/profile')}
              isCollapsed={isCollapsed}
            />
          </Flex>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
                <div>
                    <NavItem icon={<IconButton variant="ghost" size="3" className="cursor-pointer text-icon-color"><HamburgerMenuIcon height="28" width="28" /></IconButton>} text="More" isCollapsed={isCollapsed} />
                </div>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
                <DropdownMenu.Item onSelect={toggleTheme} className="cursor-pointer">
                    {theme === 'light' ? <MoonIcon/> : <SunIcon/>} Switch Appearance
                </DropdownMenu.Item>
                <DropdownMenu.Separator />
                <DropdownMenu.Item onSelect={handleSignOut} className="cursor-pointer"><ExitIcon/> Sign Out</DropdownMenu.Item>
                <DropdownMenu.Separator />
                <AlertDialog.Root>
                    <AlertDialog.Trigger><DropdownMenu.Item color="red" className="cursor-pointer" onSelect={(e) => e.preventDefault()}><TrashIcon/> Delete Account</DropdownMenu.Item></AlertDialog.Trigger>
                    <AlertDialog.Content style={{ maxWidth: 450 }}>
                        <AlertDialog.Title>Delete Account</AlertDialog.Title>
                        <AlertDialog.Description size="2">Are you sure? This action is permanent.</AlertDialog.Description>
                        <Flex gap="3" mt="4" justify="end">
                            <AlertDialog.Cancel><Button variant="soft" color="gray">Cancel</Button></AlertDialog.Cancel>
                            <AlertDialog.Action><Button variant="solid" color="red" onClick={handleDeleteAccount}>Delete Account</Button></AlertDialog.Action>
                        </Flex>
                    </AlertDialog.Content>
                </AlertDialog.Root>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </Flex>
      </aside>

      {/* Search Panel */}
      <div className={`fixed top-0 left-0 h-screen z-30 bg-white dark:bg-black/30 border-r border-gray-200 dark:border-gray-700 p-4 transform transition-transform duration-300 ${isSearchPanelOpen ? 'translate-x-24' : '-translate-x-full'} w-96`}>
        <Flex direction="column" gap="4" className="h-full pt-4">
            <Heading as="h2" size="7">Search</Heading>
            <TextField.Root placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} size="3" />
            <hr className="border-gray-200 dark:border-gray-700 my-2" />
            
            <ScrollArea type="auto" scrollbars="vertical" className="flex-grow">
              <Flex direction="column" gap="3">
                  {searchLoading && <Flex justify="center" p="4"><Spinner /></Flex>}
                  {!searchLoading && searchResults.map(user => (
                      <Link to={`/profile/${user._id}`} key={user._id} onClick={() => {setIsSearchPanelOpen(false); setSearchQuery('');}}>
                          <Flex align="center" gap="3" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                              <Avatar src={getProxiedUrl(user.profilePicture)} fallback={user.name.charAt(0).toUpperCase()} radius="full" />
                              <Text>{user.name}</Text>
                          </Flex>
                      </Link>
                  ))}
                  {!searchLoading && searchQuery && searchResults.length === 0 && (
                      <Text color="gray" align="center" p="4">No results found.</Text>
                  )}
              </Flex>
            </ScrollArea>
        </Flex>
      </div>

      {/* Create Post/Story Modal */}
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

export default Sidebar;
