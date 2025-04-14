import React, { useCallback, useEffect, useState } from "react";
import { io } from "socket.io-client";

const SOCKET_SERVER_URL = "http://localhost:4000";
const JOIN_EVENT = "join_room";
const SEND_EVENT = "send_message";
const RECEIVE_EVENT = "receive_message";

export default function Chat() {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [mySocketId, setMySocketId] = useState(null);

  const [roomToJoin, setRoomToJoin] = useState("");
  const [joinedRoom, setJoinedRoom] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [receivedMessages, setReceivedMessages] = useState([]);

  useEffect(() => {
    // connet to socket server
    const newSocket = io(SOCKET_SERVER_URL);
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected to socket server: ", newSocket.id);
      setIsConnected(true);
      setMySocketId(newSocket.id);
      setJoinedRoom("");
    });

    newSocket.on(RECEIVE_EVENT, (data) => {
      console.log("Received message:", data);
      setReceivedMessages((prevMessages) => [...prevMessages, data]);
    });

    return () => {
      console.log("Disconnecting from socket server");
      newSocket.disconnect();
    };
  }, []);

  const handleRoomToJoinChange = (event) => {
    setRoomToJoin(event.target.value);
  };

  const handleJoinRoom = useCallback(() => {
    if (socket && isConnected && roomToJoin.trim()) {
      socket.emit(JOIN_EVENT, roomToJoin);
      console.log("Joining room:", roomToJoin);
      setJoinedRoom(roomToJoin);
      setRoomToJoin("");
    }
  }, [socket, isConnected, roomToJoin]);

  const handleMessageInputChange = (event) => {
    setMessageInput(event.target.value);
  };

  const handleSendMessage = useCallback(() => {
    if (socket && isConnected && messageInput.trim() && joinedRoom) {
      const payload = {
        message: messageInput,
        roomId: joinedRoom,
      };

      socket.emit(SEND_EVENT, payload);
      console.log("Sent message:", payload);
      setMessageInput("");
    }
  }, [socket, isConnected, messageInput, joinedRoom]);

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      handleSendMessage();
    }
  };

  return (
    <div>
      <p>
        Status: <span>{isConnected ? "Connected" : "Disconnected"}</span>
      </p>
      {mySocketId && (
        <p>
          My Socket ID: <span>{mySocketId}</span> (You can use this in the 'Send
          To' field on another client to test direct messages)
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

      <div>
        <h3>Messages</h3>
        {receivedMessages.length > 0 ? (
          <ul>
            {receivedMessages.map((message, index) => (
              <li key={index}>{message}</li>
            ))}
          </ul>
        ) : (
          <p>No messages yet</p>
        )}
      </div>

      <div>
        <input
          type="text"
          value={messageInput}
          onChange={handleMessageInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  );
}
