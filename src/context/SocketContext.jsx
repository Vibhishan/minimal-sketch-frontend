import React, { createContext, useState, useEffect } from "react";
import { io } from "socket.io-client";
import {
  SOCKET_SERVER_URL,
  JOIN_ROOM,
  LEAVE_ROOM,
} from "../constants/webSocketEvents";

export const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [roomId, setRoomId] = useState("");
  const [playerName, setPlayerName] = useState("");

  useEffect(() => {
    const newSocket = io(SOCKET_SERVER_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      withCredentials: true,
    });

    newSocket.on("connect", () => {
      console.log("Connected to socket server");
      setIsConnected(true);
      setError(null);
    });

    newSocket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
      setError(err.message);
      setIsConnected(false);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("Disconnected from socket server:", reason);
      setIsConnected(false);
      if (reason === "io server disconnect") {
        // The server has forcefully disconnected the socket
        newSocket.connect();
      }
    });

    newSocket.on("error", (err) => {
      console.error("Socket error:", err);
      setError(err.message);
    });

    setSocket(newSocket);

    return () => {
      console.log("Cleaning up socket connection");
      newSocket.close();
    };
  }, []);

  const joinRoom = (roomId, name) => {
    if (socket && isConnected) {
      console.log("Joining room:", roomId, "with name:", name);
      socket.emit(JOIN_ROOM, { roomId, playerName: name });
      setRoomId(roomId);
      setPlayerName(name);
    } else {
      console.error("Cannot join room: socket not ready", {
        isConnected,
        socket: !!socket,
      });
    }
  };

  const leaveRoom = () => {
    if (socket && isConnected && roomId) {
      console.log("Leaving room:", roomId);
      socket.emit(LEAVE_ROOM, { roomId });
      setRoomId("");
      setPlayerName("");
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        error,
        roomId,
        playerName,
        joinRoom,
        leaveRoom,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
