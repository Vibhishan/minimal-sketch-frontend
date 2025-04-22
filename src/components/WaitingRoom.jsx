import React, { useState, useEffect, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SocketContext } from "../context/SocketContext";
import {
  CREATE_ROOM,
  JOIN_ROOM,
  START_GAME,
  ROOM_CREATED,
  PLAYER_JOINED,
  PLAYER_LEFT,
  GAME_STARTED,
} from "../constants/webSocketEvents";
import "../styles/WaitingRoom.css";

export default function WaitingRoom() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    socket,
    isConnected,
    error: socketError,
    joinRoom,
  } = useContext(SocketContext);
  const [roomId, setRoomId] = useState("");
  const [players, setPlayers] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Get state from location
  const state = location.state;
  const playerName = state?.playerName;
  const roomCode = state?.roomCode;
  const isHost = state?.isHost;

  useEffect(() => {
    if (!state) {
      navigate("/");
      return;
    }

    if (!socket || !isConnected) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    if (isHost) {
      console.log("Creating room with player:", playerName);
      socket.emit(CREATE_ROOM, { playerName });
    } else if (roomCode) {
      console.log("Joining room:", roomCode, "with player:", playerName);
      joinRoom(roomCode, playerName);
    }

    socket.on(ROOM_CREATED, (data) => {
      console.log("Room created:", data);
      setRoomId(data.roomId);
      setPlayers([{ id: socket.id, name: playerName }]);
      setIsLoading(false);
    });

    socket.on(PLAYER_JOINED, (data) => {
      console.log("Player joined:", data);
      setPlayers((prev) => {
        const playerExists = prev.some((p) => p.id === data.id);
        if (!playerExists) {
          return [...prev, { id: data.id, name: data.playerName }];
        }
        return prev;
      });
    });

    socket.on(PLAYER_LEFT, (data) => {
      console.log("Player left:", data);
      setPlayers((prev) => prev.filter((p) => p.id !== data.id));
    });

    socket.on(GAME_STARTED, () => {
      console.log("Game started, navigating to game screen");
      navigate("/game", {
        state: { roomId: roomId || roomCode, playerName, players },
      });
    });

    socket.on("error", (err) => {
      console.error("Socket error:", err);
      setError(err.message || "An error occurred");
      setIsLoading(false);
    });

    return () => {
      socket.off(ROOM_CREATED);
      socket.off(PLAYER_JOINED);
      socket.off(PLAYER_LEFT);
      socket.off(GAME_STARTED);
      socket.off("error");
    };
  }, [
    socket,
    isConnected,
    playerName,
    isHost,
    roomCode,
    state,
    navigate,
    joinRoom,
  ]);

  const handleStartGame = () => {
    if (socket && isConnected && (roomId || roomCode)) {
      socket.emit(START_GAME, { roomId: roomId || roomCode });
      navigate("/game", {
        state: { roomId: roomId || roomCode, playerName, players },
      });
    }
  };

  const copyRoomCode = () => {
    if (roomId || roomCode) {
      navigator.clipboard.writeText(roomId || roomCode);
      // You might want to add a visual feedback here
    }
  };

  if (isLoading) {
    return (
      <div className="waiting-room">
        <h2>Connecting to room...</h2>
      </div>
    );
  }

  if (socketError) {
    return (
      <div className="waiting-room">
        <h2>Connection Error</h2>
        <p>{socketError}</p>
        <button onClick={() => navigate("/")}>Return to Home</button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="waiting-room">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate("/")}>Return to Home</button>
      </div>
    );
  }

  return (
    <div className="waiting-room">
      <div className="room-code-section">
        <h2>Room Code: {roomId || roomCode || "Waiting for room code..."}</h2>
        {(roomId || roomCode) && (
          <button onClick={copyRoomCode} className="copy-btn">
            Copy Code
          </button>
        )}
      </div>
      {error && <div className="error">{error}</div>}

      <div className="players-list">
        <h3>Players in Room:</h3>
        <ul>
          {players.map((player) => (
            <li key={player.id}>
              {player.name} {player.id === socket?.id && "(You)"}
            </li>
          ))}
        </ul>
      </div>

      {isHost && (
        <button
          onClick={handleStartGame}
          disabled={players.length < 2}
          className="start-game-btn"
        >
          Start Game
        </button>
      )}
    </div>
  );
}
