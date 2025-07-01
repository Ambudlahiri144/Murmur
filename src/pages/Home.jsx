import React, { useState, useEffect } from 'react';
import TopHeader from '../components/TopHeader'; // <-- 1. Import TopHeader
import Sidebar from '../components/Sidebar';   // <-- 2. Import Sidebar
import StoryReel from '../components/StoryReel';
import Post from '../components/Post';
import Suggestions from '../components/Suggestions';
import { Flex, Spinner, Callout } from '@radix-ui/themes';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import axios from 'axios';

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const API_URL = 'http://localhost:5000';

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      if (!token) {
        setError("Please log in to see the feed.");
        setLoading(false);
        return;
      }
      const config = { headers: { 'x-auth-token': token } };

      try {
        const res = await axios.get(`${API_URL}/api/posts`, config);
        setPosts(res.data);
      } catch (err) {
        setError("Failed to fetch posts.");
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  return (
    <div className="bg-gray-50 dark:bg-murmur-dark min-h-screen">
      <TopHeader /> {/* <-- 3. Render TopHeader */}
      <Sidebar />   {/* <-- 4. Render Sidebar */}
      {/* 5. Adjust padding for both headers */}
      <main className="pt-24 pl-20 xl:pl-72 pr-4">
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <StoryReel />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Flex direction="column" gap="8">
                  {loading && <Flex justify="center"><Spinner size="large" /></Flex>}
                  {error && <Callout.Root color="red"><Callout.Icon><InfoCircledIcon /></Callout.Icon><Callout.Text>{error}</Callout.Text></Callout.Root>}
                  {posts.map(post => (
                    <Post key={post._id} post={post} />
                  ))}
                </Flex>
              </div>
              <div className="hidden lg:block">
                <Suggestions />
              </div>
            </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
