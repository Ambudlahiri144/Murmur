import React, { createContext, useState, useEffect, useContext } from "react";
import { io } from "socket.io-client";
import axios from 'axios';

const SocketContext = createContext();

// A custom hook to easily use the context
export const useSocket = () => {
	return useContext(SocketContext);
};

export const SocketContextProvider = ({ children }) => {
	const [socket, setSocket] = useState(null);
	const [onlineUsers, setOnlineUsers] = useState([]);
	const [notifications, setNotifications] = useState([]);
    const [currentUserId, setCurrentUserId] = useState(null);

	useEffect(() => {
        const token = sessionStorage.getItem("token");
		if (token) {
            const userId = JSON.parse(atob(token.split('.')[1])).user.id;
            setCurrentUserId(userId);

			const newSocket = io("http://localhost:5000", {
				query: {
					userId: userId,
				},
			});

			setSocket(newSocket);

			newSocket.on("getOnlineUsers", (users) => {
				setOnlineUsers(users);
			});

            newSocket.on("newNotification", (notification) => {
                setNotifications(prev => [notification, ...prev]);
            });

            // Fetch initial notifications
            const fetchNotifications = async () => {
                try {
                    const config = { headers: { 'x-auth-token': token } };
                    const res = await axios.get('http://localhost:5000/api/notifications', config);
                    setNotifications(res.data);
                } catch (error) {
                    console.error("Failed to fetch notifications", error);
                }
            };
            fetchNotifications();

			return () => newSocket.close();
		} else {
            if(socket) {
                socket.close();
                setSocket(null);
            }
        }
	}, [currentUserId]);

	return (
        <SocketContext.Provider value={{ socket, onlineUsers, notifications, setNotifications }}>
            {children}
        </SocketContext.Provider>
    );
};
