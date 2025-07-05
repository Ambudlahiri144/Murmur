import React, { useState, useEffect } from 'react';
import { Card, Flex, Avatar, Text, IconButton, TextField, Strong, DropdownMenu, AlertDialog, Button, Dialog, Checkbox, ScrollArea, Spinner } from '@radix-ui/themes';
import { DotsHorizontalIcon, HeartIcon, ChatBubbleIcon, PaperPlaneIcon, BookmarkIcon, ChevronLeftIcon, ChevronRightIcon, TrashIcon, HeartFilledIcon } from '@radix-ui/react-icons';
import axios from 'axios';
import { getProxiedUrl } from '../utils/mediaHelper';

const Post = ({ post }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [likes, setLikes] = useState(post?.likes || []);
  const [comments, setComments] = useState(post?.comments || []);
  const [isLiked, setIsLiked] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(false);

  // --- State for Share Modal ---
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [followingList, setFollowingList] = useState([]);
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareSearch, setShareSearch] = useState('');

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (token) {
      const userId = JSON.parse(atob(token.split('.')[1])).user.id;
      setCurrentUserId(userId);
      if (post?.likes?.some(like => like.user === userId || like === userId)) {
        setIsLiked(true);
      }
    }
  }, [post?.likes]);

  if (!post) return null;

  const username = post.user?.name;
  const userAvatar = post.user?.profilePicture;
  const hasMedia = post.media && Array.isArray(post.media) && post.media.length > 0;
  if (!hasMedia) return null;
  
  const currentMedia = post.media[currentImageIndex];
  const displayTimestamp = new Date(post.date).toLocaleDateString();

  // --- Interaction Handlers ---
  const handleLikeToggle = async () => {
    const token = sessionStorage.getItem('token');
    const config = { headers: { 'x-auth-token': token } };
    const action = isLiked ? 'unlike' : 'like';
    try {
      const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/posts/${action}/${post._id}`, {}, config);
      setLikes(res.data);
      setIsLiked(!isLiked);
    } catch (err) {
      console.error(`Failed to ${action} post`, err);
    }
  };
  
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const token = sessionStorage.getItem('token');
    const config = { headers: { 'Content-Type': 'application/json', 'x-auth-token': token } };
    const body = JSON.stringify({ text: newComment });
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/posts/comment/${post._id}`, body, config);
      setComments(res.data);
      setNewComment('');
      setShowComments(true);
    } catch (err) {
      console.error("Failed to add comment", err);
    }
  };

  const handleDeletePost = async () => {
    const token = sessionStorage.getItem('token');
    const config = { headers: { 'x-auth-token': token } };
    try {
        await axios.delete(`${import.meta.env.VITE_API_URL}/api/posts/${post._id}`, config);
        window.location.reload();
    } catch (err) {
        console.error("Failed to delete post", err);
    }
  };

  const goToPrevious = () => {
    const isFirstImage = currentImageIndex === 0;
    const newIndex = isFirstImage ? post.media.length - 1 : currentImageIndex - 1;
    setCurrentImageIndex(newIndex);
  };

  const goToNext = () => {
    const isLastImage = currentImageIndex === post.media.length - 1;
    const newIndex = isLastImage ? 0 : currentImageIndex + 1;
    setCurrentImageIndex(newIndex);
  };

  const openShareModal = async () => {
    setIsShareModalOpen(true);
    setShareLoading(true);
    const token = sessionStorage.getItem('token');
    const config = { headers: { 'x-auth-token': token } };
    try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/profile/following`, config);
        setFollowingList(res.data);
    } catch (err) {
        console.error("Failed to fetch following list", err);
    } finally {
        setShareLoading(false);
    }
  };

  const handleRecipientSelect = (userId) => {
    setSelectedRecipients(prev => 
        prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSendShare = async () => {
      if(selectedRecipients.length === 0) return;
      setShareLoading(true);
      const token = sessionStorage.getItem('token');
      const config = { headers: { 'Content-Type': 'application/json', 'x-auth-token': token } };
      const body = { postId: post._id, recipients: selectedRecipients };
      try {
          await axios.post(`${import.meta.env.VITE_API_URL}/api/messages/share`, body, config);
          setIsShareModalOpen(false);
          setSelectedRecipients([]);
          setShareSearch('');
      } catch (err) {
          console.error("Failed to share post", err);
      } finally {
          setShareLoading(false);
      }
  };
  
  const filteredFollowing = followingList.filter(user => 
    user.name.toLowerCase().includes(shareSearch.toLowerCase())
  );

  return (
    <>
      <Card className="w-full dark:bg-murmur-post-bg dark:text-murmur-post-text font-judson">
        <Flex align="center" justify="between" p="3">
            <Flex align="center" gap="3">
                <Avatar src={getProxiedUrl(userAvatar)} fallback={username ? username.charAt(0).toUpperCase() : '?'} radius="full" />
                 <Text size="3" weight="bold" className="dark:!text-murmur-post-text">{username || 'User'}</Text>
            </Flex>
            {post.user?._id === currentUserId && (
                <DropdownMenu.Root>
                    <DropdownMenu.Trigger>
                        <IconButton variant="ghost" className="cursor-pointer dark:!text-murmur-post-text"><DotsHorizontalIcon /></IconButton>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content>
                        <AlertDialog.Root>
                            <AlertDialog.Trigger>
                                <DropdownMenu.Item color="red" className="cursor-pointer" onSelect={(event) => event.preventDefault()}>
                                    <TrashIcon/> Delete Post
                                </DropdownMenu.Item>
                            </AlertDialog.Trigger>
                            <AlertDialog.Content style={{ maxWidth: 450 }}>
                                <AlertDialog.Title>Delete Post</AlertDialog.Title>
                                <AlertDialog.Description size="2">This action cannot be undone.</AlertDialog.Description>
                                <Flex gap="3" mt="4" justify="end">
                                    <AlertDialog.Cancel><Button variant="soft" color="gray">Cancel</Button></AlertDialog.Cancel>
                                    <AlertDialog.Action><Button variant="solid" color="red" onClick={handleDeletePost}>Delete</Button></AlertDialog.Action>
                                </Flex>
                            </AlertDialog.Content>
                        </AlertDialog.Root>
                    </DropdownMenu.Content>
                </DropdownMenu.Root>
            )}
        </Flex>

        <div className="relative">
            {currentMedia.mediaType === 'video' ? (
              <video className="w-full h-auto" controls autoPlay loop muted>
                <source src={getProxiedUrl(currentMedia.url)} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <img src={getProxiedUrl(currentMedia.url)} alt={post.caption || 'Post media'} className="w-full h-auto object-cover" />
            )}
            {post.media.length > 1 && (
              <>
                <IconButton onClick={goToPrevious} size="2" radius="full" className="!absolute top-1/2 left-2 -translate-y-1/2 !bg-black/50 hover:!bg-black/75"><ChevronLeftIcon color="white" /></IconButton>
                <IconButton onClick={goToNext} size="2" radius="full" className="!absolute top-1/2 right-2 -translate-y-1/2 !bg-black/50 hover:!bg-black/75"><ChevronRightIcon color="white" /></IconButton>
                <Flex gap="1" justify="center" className="absolute bottom-2 left-0 right-0">
                    {post.media.map((_, index) => (<div key={index} className={`w-1.5 h-1.5 rounded-full transition-colors ${index === currentImageIndex ? 'bg-white' : 'bg-white/50'}`} />))}
                </Flex>
              </>
            )}
        </div>

        <Flex align="center" justify="between" p="3">
            <Flex align="center" gap="4">
                <IconButton variant="ghost" size="3" className="cursor-pointer dark:!text-murmur-post-text" onClick={handleLikeToggle}>{isLiked ? <HeartFilledIcon height="24" width="24" className="text-red-500" /> : <HeartIcon height="24" width="24" />}</IconButton>
                <IconButton variant="ghost" size="3" className="cursor-pointer dark:!text-murmur-post-text" onClick={() => setShowComments(!showComments)}><ChatBubbleIcon height="24" width="24" /></IconButton>
                <IconButton variant="ghost" size="3" className="cursor-pointer dark:!text-murmur-post-text" onClick={openShareModal}><PaperPlaneIcon height="24" width="24" /></IconButton>
            </Flex>
            <IconButton variant="ghost" size="3" className="cursor-pointer dark:!text-murmur-post-text"><BookmarkIcon height="24" width="24" /></IconButton>
        </Flex>

        <Flex direction="column" px="3" gap="1">
            <Text size="3" weight="bold" className="dark:!text-murmur-post-text">{likes.length} likes</Text>
            <Text size="3" className="dark:!text-murmur-post-text font-judson"><Strong className="dark:!text-murmur-post-text font-judson">{username || 'User'}</Strong> {post.caption}</Text>
            
            {comments.length > 0 && (
              <Text size="1" color="gray" className="cursor-pointer hover:underline dark:!text-murmur-post-text" onClick={() => setShowComments(!showComments)}>
                View all {comments.length} comments
              </Text>
            )}
            
            {showComments && (
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                    {comments.map((comment) => {
                        const commenterName = comment.name || 'User';
                        return (
                            <Flex key={comment._id} gap="2" align="center">
                                <Avatar 
                                    src={getProxiedUrl(comment.avatar)}
                                    fallback={commenterName.charAt(0).toUpperCase()}
                                    size="1"
                                    radius="full"
                                />
                                <Text size="2" className="dark:!text-murmur-post-text font-judson"><Strong className="dark:!text-murmur-post-text font-judson">{commenterName}</Strong> {comment.text}</Text>
                            </Flex>
                        );
                    })}
                </div>
            )}
            
            <Text size="1" color="#2c1b08" mt="1">{displayTimestamp}</Text>
        </Flex>

        <form onSubmit={handleCommentSubmit}>
            <Flex align="center" p="3" mt="2" className="border-t border-gray-200 dark:border-gray-700">
                <TextField.Root 
                  placeholder="Add a comment..." 
                  className="w-full"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <Button type="submit" variant="ghost" className="dark:!text-murmur-post-text font-judson" disabled={!newComment.trim()}>Post</Button>
            </Flex>
        </form>
      </Card>

      <Dialog.Root open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <Dialog.Content style={{ maxWidth: 450 }}>
          <Dialog.Title>Share Post</Dialog.Title>
          <Dialog.Description size="2" mb="4">Send this post to your followers.</Dialog.Description>
          
          <TextField.Root placeholder="Search for followers..." mb="3" value={shareSearch} onChange={(e) => setShareSearch(e.target.value)} />

          <ScrollArea type="auto" scrollbars="vertical" style={{ height: 250 }}>
            {shareLoading ? <Flex justify="center" p="4"><Spinner/></Flex> : 
              <Flex direction="column" gap="3">
                {filteredFollowing.map(user => (
                  <label key={user._id}>
                    <Flex gap="3" align="center" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                      <Checkbox size="3" onCheckedChange={() => handleRecipientSelect(user._id)}/>
                      <Avatar src={getProxiedUrl(user.profilePicture)} fallback={user.name.charAt(0).toUpperCase()} radius="full"/>
                      <Text weight="bold">{user.name}</Text>
                    </Flex>
                  </label>
                ))}
              </Flex>
            }
          </ScrollArea>
          
          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close><Button variant="soft" color="gray">Cancel</Button></Dialog.Close>
            <Button onClick={handleSendShare} disabled={shareLoading || selectedRecipients.length === 0}>
                {shareLoading ? <Spinner/> : `Send to ${selectedRecipients.length} user(s)`}
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </>
  );
};

export default Post;
