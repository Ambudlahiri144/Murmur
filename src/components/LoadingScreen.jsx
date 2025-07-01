import React from 'react';
import { Flex, Text } from '@radix-ui/themes';
import logo from '../assets/logo_sm.png'; // Make sure this path is correct

const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-murmur-dark">
      {/* Main Logo */}
      <Flex flexGrow="1" align="center" justify="center">
        <img src={logo} alt="Murmur Logo" className="w-70 h-40 animate-pulse" />
      </Flex>

      {/* Footer Text */}
      <Flex direction="column" align="center" justify="center" className="pb-8">
        <Text size="2" className="text-gray-400">by</Text>
        <Text 
          size="4" 
          className="font-bold bg-gradient-to-r from-green-400 to-cyan-400 text-transparent bg-clip-text"
        >
          Ambud Lahiri
        </Text>
      </Flex>
    </div>
  );
};

export default LoadingScreen;
