import React, { createContext, useState, useEffect } from "react";
import { io } from "socket.io-client";
import { SOCKET_SERVER_URL, JOIN_EVENT } from "../constants/webSocketEvents.js";
import Canvas from "./Canvas";
import Chat from "./Chat";
import "./Game.css";

// Create a context for the socket connection
export const SocketContext = createContext(null);

export default function Game() {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [mySocketId, setMySocketId] = useState(null);
  const [roomToJoin, setRoomToJoin] = useState("");
  const [joinedRoom, setJoinedRoom] = useState("");

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(SOCKET_SERVER_URL);
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected to socket server: ", newSocket.id);
      setIsConnected(true);
      setMySocketId(newSocket.id);
      setJoinedRoom("");
    });

    return () => {
      console.log("Disconnecting from socket server");
      newSocket.disconnect();
    };
  }, []);

  const handleRoomToJoinChange = (event) => {
    setRoomToJoin(event.target.value);
  };

  const handleJoinRoom = () => {
    if (socket && isConnected && roomToJoin.trim()) {
      socket.emit(JOIN_EVENT, roomToJoin);
      console.log("Joining room:", roomToJoin);
      setJoinedRoom(roomToJoin);
      setRoomToJoin("");
    }
  };

  return (
    <SocketContext.Provider
      value={{ socket, isConnected, mySocketId, joinedRoom }}
    >
      <div className="game-container">
        <div className="game-header">
          <p>
            Status: <span>{isConnected ? "Connected" : "Disconnected"}</span>
          </p>
          {mySocketId && (
            <p>
              My Socket ID: <span>{mySocketId}</span>
            </p>
          )}
          <div>
            <input
              type="text"
              value={roomToJoin}
              onChange={handleRoomToJoinChange}
              placeholder="Enter Room ID"
            />
            <button onClick={handleJoinRoom}>Join</button>
          </div>
        </div>

        <div className="game-content">
          <div className="canvas-section">
            <Canvas />
          </div>
          <div className="chat-section">
            <Chat />
          </div>
        </div>
      </div>
    </SocketContext.Provider>
  );
}
