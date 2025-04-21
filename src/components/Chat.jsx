import React, { useState, useContext } from "react";
import { SEND_EVENT, RECEIVE_EVENT } from "../constants/webSocketEvents.js";
import { SocketContext } from "./Game";

export default function Chat() {
  const [messageInput, setMessageInput] = useState("");
  const [receivedMessages, setReceivedMessages] = useState([]);
  const { socket, isConnected, joinedRoom } = useContext(SocketContext);

  const handleMessageInputChange = (event) => {
    setMessageInput(event.target.value);
  };

  const handleSendMessage = () => {
    if (socket && isConnected && messageInput.trim() && joinedRoom) {
      const payload = {
        message: messageInput,
        roomId: joinedRoom,
      };

      socket.emit(SEND_EVENT, payload);
      console.log("Sent message:", payload);
      setMessageInput("");
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      handleSendMessage();
    }
  };

  React.useEffect(() => {
    if (!socket) return;

    socket.on(RECEIVE_EVENT, (data) => {
      console.log("Received message:", data);
      setReceivedMessages((prevMessages) => [...prevMessages, data]);
    });

    return () => {
      socket.off(RECEIVE_EVENT);
    };
  }, [socket]);

  return (
    <div className="chat-container">
      <div className="messages-container">
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

      <div className="message-input">
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
