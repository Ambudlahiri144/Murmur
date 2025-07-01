import React, { useState, useEffect } from 'react';
import { Box, Grid, Spinner, Callout, Heading, Dialog } from '@radix-ui/themes';
import { InfoCircledIcon, VideoIcon } from '@radix-ui/react-icons';
import TopHeader from '../components/TopHeader';
import Sidebar from '../components/Sidebar';
import Post from '../components/Post'; // <-- 1. Import the Post component
import axios from 'axios';
import { getProxiedUrl } from '../utils/mediaHelper';

const Explore = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // --- 2. Add state for the post modal ---
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

  const API_URL = 'http://localhost:5000';

  useEffect(() => {
    const fetchExplorePosts = async () => {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      if (!token) {
        setError("Please log in to explore posts.");
        setLoading(false);
        return;
      }
      const config = { headers: { 'x-auth-token': token } };

      try {
        const res = await axios.get(`${API_URL}/api/posts/explore`, config);
        setPosts(res.data);
      } catch (err) {
        setError("Failed to fetch posts for explore page.");
      } finally {
        setLoading(false);
      }
    };

    fetchExplorePosts();
  }, []);

  // --- 3. Handler to open the modal with the selected post ---
  const handlePostClick = (post) => {
    setSelectedPost(post);
    setIsPostModalOpen(true);
  };

  return (
    <div className="bg-gray-50 dark:bg-murmur-dark min-h-screen">
      <TopHeader />
      <Sidebar />
      <main className="pt-24 pl-20 xl:pl-72 pr-4">
        <div className="max-w-5xl mx-auto">
          <Heading as="h1" size="8" mb="6">Explore</Heading>
          {loading ? (
            <div className="flex justify-center mt-10"><Spinner size="large" /></div>
          ) : error ? (
            <Callout.Root color="red"><Callout.Icon><InfoCircledIcon /></Callout.Icon><Callout.Text>{error}</Callout.Text></Callout.Root>
          ) : (
            <Grid columns={{ initial: '1', sm: '2', md: '3' }} gap="4">
              {posts.map(post => {
                if (!post.media || post.media.length === 0) return null;
                const firstMedia = post.media[0];
                return (
                  // --- 4. Add onClick to the grid item ---
                  <div key={post._id} onClick={() => handlePostClick(post)} className="relative aspect-square bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden group cursor-pointer">
                    {firstMedia.mediaType === 'video' ? (
                      <video src={getProxiedUrl(firstMedia.url)} className="w-full h-full object-cover" />
                    ) : (
                      <img src={getProxiedUrl(firstMedia.url)} alt={post.caption} className="w-full h-full object-cover" />
                    )}
                    {post.media.length > 1 && (
                      <span className="absolute top-2 right-2 text-white text-xs font-bold bg-black/50 p-1 rounded">
                        {post.media.length}
                      </span>
                    )}
                    {firstMedia.mediaType === 'video' && <VideoIcon className="absolute top-2 left-2 text-white shadow-lg" width="20" height="20" />}
                  </div>
                );
              })}
            </Grid>
          )}
        </div>
      </main>

      {/* --- 5. Add the Post Modal Dialog --- */}
      <Dialog.Root open={isPostModalOpen} onOpenChange={setIsPostModalOpen}>
        <Dialog.Content style={{ maxWidth: 800, padding: 0 }}>
            {selectedPost && (
                <Post post={selectedPost} />
            )}
        </Dialog.Content>
      </Dialog.Root>

    </div>
  );
};

export default Explore;
