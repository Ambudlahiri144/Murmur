import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, TextField, Button, Text, Flex, Heading, Strong, Callout } from '@radix-ui/themes';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import axios from 'axios';
import logo from '../assets/logo.png';
import backgroundImage from '../assets/photo1.png';

const Register = () => {
  const navigate = useNavigate();
  const fullText = "Create Account";
  const [animatedText, setAnimatedText] = useState('');
  
  // State for form fields
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  // State for handling errors from the API
  const [error, setError] = useState(null);
  // State for showing a loading indicator on the button
  const [loading, setLoading] = useState(false);

  const { name, email, password } = formData;

  // Typewriter animation effect
  useEffect(() => {
    const intervalId = setInterval(() => {
      setAnimatedText((prev) => {
        if (prev.length < fullText.length) {
          return prev + fullText.charAt(prev.length);
        } else {
          clearInterval(intervalId);
          return prev;
        }
      });
    }, 150);
    return () => clearInterval(intervalId);
  }, []);

  // Function to update state when user types in an input field
  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  // Function to handle form submission
  const onSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const newUser = { name, email, password };
      const config = {
        headers: {
          'Content-Type': 'application/json',
        },
      };
      const body = JSON.stringify(newUser);
      
      // Send a POST request to the backend registration endpoint
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/register`, body, config);
      
      // On success, store the authentication token in sessionStorage
      sessionStorage.setItem('token', res.data.token);

      // Navigate the user to the home page
      navigate('/home');

    } catch (err) {
      // If there's an error, display it to the user
      setError(err.response?.data?.msg || 'An unknown error occurred.');
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen">
      <div 
        className="absolute inset-0 bg-cover bg-center z-0" 
        style={{ backgroundImage: `url(${backgroundImage})` }} 
      />
      <div className="absolute inset-0 bg-black/30 backdrop-blur-md z-10" />
      <div className="relative z-20 flex items-center justify-center min-h-screen p-4">
        <div className="flex flex-col md:flex-row w-full max-w-sm md:max-w-4xl rounded-lg shadow-lg overflow-hidden bg-black/20 backdrop-blur-lg border border-white/20">
          <div className="hidden md:flex md:w-1/2 items-center justify-center p-8">
              <img 
                src={logo}
                alt="Murmur App Logo" 
                className="max-w-xs"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
          </div>
          <div className="w-full md:w-1/2 flex items-center justify-center p-8">
              <Card className="w-full max-w-md !bg-transparent !shadow-none">
                  <Flex direction="column" gap="4">
                      <div className="text-center text-white h-20 flex items-center justify-center">
                          <Heading as="h1" size="8" className="font-raleway">
                            {animatedText}
                            <span className="inline-block w-1 h-12 bg-white ml-2 animate-blink"></span>
                          </Heading>
                      </div>
                      <div className="text-center text-white/80 -mt-4">
                        <Text as="p" mt="2">
                           Sign up to see photos and videos from your friends.
                        </Text>
                      </div>
                      
                      {/* Error Message Display */}
                      {error && (
                        <Callout.Root color="red" role="alert">
                          <Callout.Icon>
                            <InfoCircledIcon />
                          </Callout.Icon>
                          <Callout.Text>{error}</Callout.Text>
                        </Callout.Root>
                      )}

                      <form className="space-y-4 text-white" onSubmit={onSubmit}>
                          <TextField.Root 
                            name="name"
                            value={name}
                            onChange={onChange}
                            placeholder="Full Name" 
                            size="3" 
                            className="!bg-white/10 !text-white placeholder:!text-white/60"
                            required
                          />
                          <TextField.Root 
                            name="email"
                            value={email}
                            onChange={onChange}
                            placeholder="Email" 
                            type="email" 
                            size="3" 
                            className="!bg-white/10 !text-white placeholder:!text-white/60"
                            required
                          />
                          <TextField.Root 
                            name="password"
                            value={password}
                            onChange={onChange}
                            placeholder="Password" 
                            type="password" 
                            size="3" 
                            className="!bg-white/10 !text-white placeholder:!text-white/60"
                            minLength="6"
                            required
                          />
                          <Button type="submit" size="3" className="!w-full !bg-cyan-500 hover:!bg-cyan-600 !cursor-pointer" disabled={loading}>
                             {loading ? 'Creating Account...' : 'Sign Up'}
                          </Button>
                      </form>
                      <div className="text-center text-white/80">
                          <Text as="p" size="2">
                              Have an account? <Link to="/login" className="font-bold text-cyan-400 hover:underline">Log in</Link>
                          </Text>
                      </div>
                  </Flex>
              </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
