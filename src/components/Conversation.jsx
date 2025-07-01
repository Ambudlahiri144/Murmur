import React from 'react';
import { Flex, Avatar, Text, Box } from '@radix-ui/themes';
import { getProxiedUrl } from '../utils/mediaHelper';

const Conversation = ({ user, isOnline, onClick }) => {
  if (!user) return null;

  return (
    <Flex
      gap="3"
      align="center"
      p="2"
      className="cursor-pointer rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
      onClick={() => onClick(user)}
    >
      <Box style={{ position: 'relative' }}>
        <Avatar
          size="4"
          radius="full"
          fallback={user.name.charAt(0).toUpperCase()}
          src={getProxiedUrl(user.profilePicture)}
        />
        {isOnline && (
          <Box className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
        )}
      </Box>
      <Flex direction="column">
        <Text weight="bold">{user.name}</Text>
        {/* We can add last message preview here later */}
      </Flex>
    </Flex>
  );
};

export default Conversation;
