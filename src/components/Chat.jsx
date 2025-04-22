import React, { useState, useContext, useEffect } from "react";
import { SEND_MESSAGE, RECEIVE_MESSAGE } from "../constants/webSocketEvents";
import { SocketContext } from "../context/SocketContext";
import "../styles/Chat.css";

export default function Chat({ playerName }) {
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState([]);
  const { socket, isConnected, roomId } = useContext(SocketContext);

  const handleSendMessage = () => {
    if (!socket || !isConnected || !roomId) {
      console.warn("Cannot send message: socket not ready or no room", {
        isConnected,
        roomId,
        socket: !!socket,
      });
      return;
    }

    if (!messageInput.trim()) return;

    const payload = {
      roomId,
      playerName,
      message: messageInput.trim(),
    };

    try {
      socket.emit(SEND_MESSAGE, payload);
      setMessageInput("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  useEffect(() => {
    if (!socket) return;

    socket.on(RECEIVE_MESSAGE, (data) => {
      console.log("Received message:", data);
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socket.off(RECEIVE_MESSAGE);
    };
  }, [socket]);

  return (
    <div className="chat-container">
      <div className="messages-container">
        {messages.map((msg, index) => (
          <div key={index} className="message">
            <span className="player-name">{msg.playerName}:</span>
            <span className="message-text">{msg.message}</span>
          </div>
        ))}
      </div>
      <div className="message-input">
        <input
          type="text"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
          placeholder="Type your message..."
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  );
}
