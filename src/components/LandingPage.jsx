import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/LandingPage.css";

export default function LandingPage() {
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  const handleCreateRoom = () => {
    if (playerName.trim()) {
      setIsCreating(true);
      navigate("/waiting-room", {
        state: {
          playerName,
          isHost: true,
        },
      });
    }
  };

  const handleJoinRoom = () => {
    if (playerName.trim() && roomCode.trim()) {
      navigate("/waiting-room", {
        state: {
          playerName,
          roomCode,
          isHost: false,
        },
      });
    }
  };

  return (
    <div className="landing-page">
      <h1>Minimal Sketch</h1>
      <div className="player-name-input">
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Enter your name"
        />
      </div>

      <div className="room-options">
        <button onClick={handleCreateRoom} className="create-room-btn">
          Create Room
        </button>

        <div className="join-room-section">
          <input
            type="text"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            placeholder="Enter room code"
          />
          <button onClick={handleJoinRoom} className="join-room-btn">
            Join Room
          </button>
        </div>
      </div>
    </div>
  );
}
