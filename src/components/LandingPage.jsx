import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/LandingPage.css";

export default function LandingPage() {
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const navigate = useNavigate();

  const handleCreateRoom = () => {
    if (playerName.trim()) {
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
      <div className="left-pane">
        <div className="game-description">
          <h1>Welcome to Minimal Sketch</h1>
          <p className="description-text">
            A minimalist drawing game where players take turns to sketch and
            guess words. Challenge your friends to a game of quick thinking and
            artistic expression!
          </p>
          <div className="features">
            <div className="feature">
              <span className="feature-icon">🎨</span>
              <h3>Express Yourself</h3>
              <p>Show off your artistic skills with our simple drawing tools</p>
            </div>
            <div className="feature">
              <span className="feature-icon">👥</span>
              <h3>Play with Friends</h3>
              <p>Create or join rooms to play with friends in real-time</p>
            </div>
            <div className="feature">
              <span className="feature-icon">⏱️</span>
              <h3>Quick Rounds</h3>
              <p>Fast-paced gameplay with timed rounds</p>
            </div>
          </div>
        </div>
      </div>
      <div className="right-pane">
        <div className="game-actions">
          <h2>Start Playing</h2>
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
      </div>
    </div>
  );
}
