import React, { useState, useContext, useEffect } from "react";
import {
  SEND_MESSAGE,
  RECEIVE_MESSAGE,
  WORD_GUESSED,
} from "../constants/webSocketEvents";
import { SocketContext } from "../context/SocketContext";
import "../styles/Chat.css";

export default function Chat({ playerName, onGuess, canGuess = true }) {
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

    // Check if this is potentially a guess
    if (canGuess && onGuess) {
      onGuess(messageInput.trim());
    }

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
      setMessages((prev) => [
        ...prev,
        {
          ...data,
          type: "message",
        },
      ]);
    });

    socket.on(WORD_GUESSED, (data) => {
      console.log("Word guessed:", data);
      if (data.correct) {
        setMessages((prev) => [
          ...prev,
          {
            playerName: data.playerName,
            message: "guessed correctly!",
            type: "correct-guess",
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            playerName: data.playerName,
            message: `guessed: ${data.guess}`,
            type: "incorrect-guess",
          },
        ]);
      }
    });

    return () => {
      socket.off(RECEIVE_MESSAGE);
      socket.off(WORD_GUESSED);
    };
  }, [socket]);

  return (
    <div className="chat-container">
      <div className="messages-container">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.type ? msg.type : ""}`}>
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
          placeholder={
            canGuess ? "Type your guess or message..." : "Type your message..."
          }
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  );
}
