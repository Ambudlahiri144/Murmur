import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Flex, Spinner, Callout } from '@radix-ui/themes';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import TopHeader from '../components/TopHeader';
import Sidebar from '../components/Sidebar';
import Post from '../components/Post';
import axios from 'axios';

const SinglePost = () => {
    const { postId } = useParams();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPost = async () => {
            setLoading(true);
            const token = sessionStorage.getItem('token');
            const config = { headers: { 'x-auth-token': token } };
            try {
                const res = await axios.get(`http://localhost:5000/api/posts/${postId}`, config);
                setPost(res.data);
            } catch (err) {
                setError('Failed to fetch post.');
            } finally {
                setLoading(false);
            }
        };

        if (postId) {
            fetchPost();
        }
    }, [postId]);

    return (
        <div className="bg-gray-50 dark:bg-murmur-dark min-h-screen">
            <TopHeader />
            <Sidebar />
            <main className="pt-24 pl-20 xl:pl-72 flex justify-center">
                <div className="max-w-xl w-full">
                    {loading && <Flex justify="center" p="8"><Spinner size="large" /></Flex>}
                    {error && <Callout.Root color="red"><Callout.Icon><InfoCircledIcon /></Callout.Icon><Callout.Text>{error}</Callout.Text></Callout.Root>}
                    {post && <Post post={post} />}
                </div>
            </main>
        </div>
    );
};

export default SinglePost;
