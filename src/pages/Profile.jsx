import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Flex, Avatar, Text, Button, Heading, Tabs, Box, Grid, Spinner, Callout, Dialog, TextField, TextArea } from '@radix-ui/themes';
import { GearIcon, InfoCircledIcon, CameraIcon, VideoIcon } from '@radix-ui/react-icons';
import TopHeader from '../components/TopHeader';
import Sidebar from '../components/Sidebar';
import Post from '../components/Post';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { getProxiedUrl } from '../utils/mediaHelper';

const Profile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [editData, setEditData] = useState({ name: '', bio: '' });
  const [editLoading, setEditLoading] = useState(false);

  const fileInputRef = useRef(null);
  const API_URL = 'http://localhost:5000';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      const token = sessionStorage.getItem('token');
      if (!token) {
        setError('No authorization token found. Please log in.');
        setLoading(false);
        return;
      }
      const config = { headers: { 'x-auth-token': token } };

      try {
        const profileEndpoint = userId ? `/api/profile/${userId}` : '/api/profile/me';
        const postsEndpoint = userId ? `/api/posts/user/${userId}` : '/api/posts/me';

        const [profileRes, postsRes, currentUserRes] = await Promise.all([
            axios.get(`${API_URL}${profileEndpoint}`, config),
            axios.get(`${API_URL}${postsEndpoint}`, config),
            axios.get(`${API_URL}/api/profile/me`, config)
        ]);
        
        setProfile(profileRes.data);
        setPosts(postsRes.data);
        setCurrentUser(currentUserRes.data);
        
        if (!userId) {
            setEditData({ name: profileRes.data.name, bio: profileRes.data.bio || '' });
        }
      } catch (err) {
        setError(err.response?.data?.msg || 'Failed to fetch profile data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  const isMyProfile = !userId || currentUser?._id === userId;
  const isFollowing = currentUser?.following.some(f => f.user === userId);
  
  const handlePostClick = (post) => {
    setSelectedPost(post);
    setIsPostModalOpen(true);
  };

  const handleFollowToggle = async () => {
      const token = sessionStorage.getItem('token');
      const config = { headers: { 'x-auth-token': token } };
      const action = isFollowing ? 'unfollow' : 'follow';
      try {
          await axios.put(`${API_URL}/api/profile/${action}/${userId}`, {}, config);
          const updatedProfileRes = await axios.get(`${API_URL}/api/profile/${userId}`, config);
          const updatedCurrentUserRes = await axios.get(`${API_URL}/api/profile/me`, config);
          setProfile(updatedProfileRes.data);
          setCurrentUser(updatedCurrentUserRes.data);
      } catch (err) {
          console.error(`Failed to ${action}`, err);
      }
  };


  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profilePicture', file);
    const token = sessionStorage.getItem('token');
    const config = { headers: { 'Content-Type': 'multipart/form-data', 'x-auth-token': token } };

    try {
      const res = await axios.post(`${API_URL}/api/profile/upload`, formData, config);
      setProfile(prev => ({ ...prev, profilePicture: res.data.filePath }));
    } catch (err) {
      setError('Profile picture upload failed.');
    }
  };

  const handleFormChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };
  
  const handleSaveChanges = async (e) => {
      e.preventDefault();
      setEditLoading(true);
      const token = sessionStorage.getItem('token');
      const config = { headers: { 'Content-Type': 'application/json', 'x-auth-token': token } };
      try {
          const res = await axios.put(`${API_URL}/api/profile/me`, editData, config);
          setProfile(res.data);
          setIsEditModalOpen(false);
      } catch(err) {
          console.error('Failed to save changes.', err);
      } finally {
          setEditLoading(false);
      }
  }

  const triggerFileSelect = () => fileInputRef.current.click();

  if (loading) return <div className="flex justify-center items-center min-h-screen"><Spinner size="large" /></div>;
  if (error) return <div className="flex justify-center items-center min-h-screen"><Callout.Root color="red"><Callout.Icon><InfoCircledIcon /></Callout.Icon><Callout.Text>{error}</Callout.Text></Callout.Root></div>;
  if (!profile) return null;

  return (
    <div className="bg-gray-50 dark:bg-murmur-dark min-h-screen">
      <TopHeader />
      <Sidebar />
      <main className="pt-24 pl-20 xl:pl-72 pr-4">
        <div className="max-w-4xl mx-auto">
            <Flex gap="8" align="center" py="6">
              <div className="flex-shrink-0">
                 <Avatar 
                    src={getProxiedUrl(profile.profilePicture)}
                    fallback={profile.name.charAt(0).toUpperCase()} 
                    size="9" 
                    radius="full" 
                 />
              </div>
              <Flex direction="column" gap="3">
                <Flex align="center" gap="4">
                  <Heading as="h1" size="7">{profile.name}</Heading>
                  {isMyProfile ? (
                    <Button variant="soft" onClick={() => setIsEditModalOpen(true)}>
                        <GearIcon width="16" height="16" /> Edit Profile
                    </Button>
                  ) : (
                    <Button onClick={handleFollowToggle} variant={isFollowing ? 'soft' : 'solid'}>
                        {isFollowing ? "Following" : "Follow"}
                    </Button>
                  )}
                </Flex>
                <Flex gap="6">
                  <Text><Text weight="bold">{posts.length}</Text> posts</Text>
                  <Text><Text weight="bold">{profile.followers.length}</Text> followers</Text>
                  <Text><Text weight="bold">{profile.following.length}</Text> following</Text>
                </Flex>
                <div>
                  <Text as="p" color="gray" className="whitespace-pre-wrap">{profile.bio || 'No bio yet.'}</Text>
                </div>
              </Flex>
            </Flex>

            {/* Edit Profile Dialog */}
            <Dialog.Root open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <Dialog.Content style={{ maxWidth: 450 }}>
                    <Dialog.Title>Edit Profile</Dialog.Title>
                    <Dialog.Description size="2" mb="4">Make changes to your profile here. Click save when you're done.</Dialog.Description>
                    <form onSubmit={handleSaveChanges}>
                        <Flex direction="column" gap="3">
                            <Flex direction="column" align="center" gap="2">
                                <Avatar 
                                    src={getProxiedUrl(profile.profilePicture)}
                                    fallback={profile.name.charAt(0).toUpperCase()} 
                                    size="8" 
                                    radius="full" 
                                />
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                                <Button type="button" variant="ghost" color="blue" onClick={triggerFileSelect}>
                                    <CameraIcon/> Change Photo
                                </Button>
                            </Flex>
                            <label>
                                <Text as="div" size="2" mb="1" weight="bold">Name</Text>
                                <TextField.Root name="name" value={editData.name} onChange={handleFormChange} placeholder="Enter your full name" />
                            </label>
                            <label>
                                <Text as="div" size="2" mb="1" weight="bold">Bio</Text>
                                <TextArea name="bio" value={editData.bio} onChange={handleFormChange} placeholder="Tell us about yourself" maxLength={150} />
                            </label>
                        </Flex>
                        <Flex gap="3" mt="4" justify="end">
                            <Dialog.Close>
                                <Button variant="soft" color="gray" type="button">Cancel</Button>
                            </Dialog.Close>
                            <Button type="submit" disabled={editLoading}>
                                {editLoading ? <Spinner/> : 'Save'}
                            </Button>
                        </Flex>
                    </form>
                </Dialog.Content>
            </Dialog.Root>

            {/* Post Display Grid and Modal */}
            <Tabs.Root defaultValue="posts">
              <Tabs.List>
                <Tabs.Trigger value="posts">Posts</Tabs.Trigger>
                <Tabs.Trigger value="saved">Saved</Tabs.Trigger>
                <Tabs.Trigger value="tagged">Tagged</Tabs.Trigger>
              </Tabs.List>
              <Box pt="4">
                <Tabs.Content value="posts">
                  <Grid columns={{ initial: '3' }} gap="4">
                    {posts.map(post => {
                      if (!post.media || post.media.length === 0) return null;
                      const firstMedia = post.media[0];
                      return (
                        <div key={post._id} onClick={() => handlePostClick(post)} className="relative aspect-square bg-gray-200 dark:bg-gray-800 rounded-md overflow-hidden group cursor-pointer">
                          {firstMedia.mediaType === 'video' ? (
                              <video src={getProxiedUrl(firstMedia.url)} className="w-full h-full object-cover" />
                          ) : (
                              <img src={getProxiedUrl(firstMedia.url)} alt={post.caption} className="w-full h-full object-cover" />
                          )}
                          {firstMedia.mediaType === 'video' && <VideoIcon className="absolute top-2 right-2 text-white shadow-lg" width="20" height="20" />}
                        </div>
                      );
                    })}
                  </Grid>
                </Tabs.Content>
              </Box>
            </Tabs.Root>

            <Dialog.Root open={isPostModalOpen} onOpenChange={setIsPostModalOpen}>
                <Dialog.Content style={{ maxWidth: 800, padding: 0 }}>
                    {selectedPost && (
                        <Post post={selectedPost} />
                    )}
                </Dialog.Content>
            </Dialog.Root>
        </div>
      </main>
    </div>
  );
};

export default Profile;
