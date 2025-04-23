import React, { useState, useEffect, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SocketContext } from "../context/SocketContext";
import {
  JOIN_ROOM,
  START_GAME,
  GAME_STARTED,
  ROUND_START,
  TURN_START,
  SCORE_UPDATE,
  WORD_SELECTED,
  TURN_END,
  PLAYER_JOINED,
  PLAYER_LEFT,
  ROOM_STATE_UPDATE,
  WORD_GUESSED,
  GUESS_WORD,
  GAME_END,
} from "../constants/webSocketEvents";
import Canvas from "./Canvas";
import Chat from "./Chat";
import Timer from "./Timer";
import Scoreboard from "./Scoreboard";
import "../styles/Game.css";

export default function Game() {
  const location = useLocation();
  const navigate = useNavigate();
  const { roomId, playerName, players: initialPlayers } = location.state;
  const { socket, isConnected, joinRoom } = useContext(SocketContext);
  const [players, setPlayers] = useState(initialPlayers || []);
  const [gameState, setGameState] = useState({
    currentRound: 0,
    maxRounds: 3,
    currentTurn: null,
    scores: {},
    wordToGuess: null,
    isDrawing: false,
    hasGuessedCorrectly: false,
    timeLeft: 60,
    isGameEnded: false,
    winner: null,
  });
  const [currentRound, setCurrentRound] = useState(0);
  const [currentTurn, setCurrentTurn] = useState(null);
  const [currentWord, setCurrentWord] = useState(null);
  const [isDrawer, setIsDrawer] = useState(false);
  const [currentPlayerId, setCurrentPlayerId] = useState(null);

  // Initialize socket connection and join room
  useEffect(() => {
    if (!socket || !isConnected) return;

    console.log("Joining room:", roomId, "with player:", playerName);
    joinRoom(roomId, playerName);

    // Listen for player updates
    socket.on(PLAYER_JOINED, (data) => {
      console.log("Player joined:", data);
      setPlayers((prevPlayers) => {
        const playerExists = prevPlayers.some((p) => p.id === data.id);
        if (!playerExists) {
          return [...prevPlayers, { id: data.id, name: data.playerName }];
        }
        return prevPlayers;
      });
    });

    socket.on(PLAYER_LEFT, (data) => {
      console.log("Player left:", data);
      setPlayers((prevPlayers) => prevPlayers.filter((p) => p.id !== data.id));
    });

    // Listen for room state updates
    socket.on(ROOM_STATE_UPDATE, (data) => {
      console.log("Room state update:", data);
      if (data) {
        setCurrentRound(data.currentRound || 1);
        setCurrentTurn(data.currentTurn || "");
        setCurrentWord(data.currentWord || null);
        setIsDrawer(data.currentTurn === socket.id);
        if (data.players) {
          setPlayers(data.players);
        }
      }
    });

    socket.on(GAME_STARTED, (data) => {
      console.log("Game started:", data);
      setGameState((prev) => ({
        ...prev,
        currentRound: 1,
        hasGuessedCorrectly: false,
        maxRounds: data.maxRounds || 3,
        isGameEnded: false,
        winner: null,
      }));
    });

    socket.on(ROUND_START, (data) => {
      console.log("Round started:", data);
      setCurrentRound(parseInt(data.round, 10));
      setCurrentWord(null);
    });

    socket.on(TURN_START, (data) => {
      console.log("Turn start received:", data);
      const { currentTurn } = data;
      const isCurrentPlayerDrawer = currentTurn === socket.id;
      console.log("Setting isDrawer to:", isCurrentPlayerDrawer);
      setIsDrawer(isCurrentPlayerDrawer);
      setCurrentTurn(currentTurn);
      // Reset the word when turn changes
      setCurrentWord(null);
    });

    socket.on(SCORE_UPDATE, (data) => {
      console.log("Score update:", data);
      if (data && data.players) {
        setPlayers(data.players);
      }
    });

    socket.on(WORD_SELECTED, (data) => {
      console.log("Word selected event received:", data);
      const { word, isDrawer } = data;
      setCurrentWord(word);
      setIsDrawer(isDrawer);
    });

    socket.on(WORD_GUESSED, (data) => {
      console.log("Word guessed:", data);
      // You can add UI notifications here for correct guesses
    });

    socket.on(GAME_END, (data) => {
      console.log("Game ended:", data);
      setGameState((prev) => ({
        ...prev,
        isGameEnded: true,
        winner: data.winner,
      }));
    });

    return () => {
      socket.off(PLAYER_JOINED);
      socket.off(PLAYER_LEFT);
      socket.off(ROOM_STATE_UPDATE);
      socket.off(GAME_STARTED);
      socket.off(ROUND_START);
      socket.off(TURN_START);
      socket.off(SCORE_UPDATE);
      socket.off(WORD_SELECTED);
      socket.off(WORD_GUESSED);
      socket.off(GAME_END);
    };
  }, [socket, isConnected, roomId, playerName, joinRoom]);

  const handleTimeUp = () => {
    console.log("Timer ended, emitting TURN_END");
    if (socket && isConnected) {
      socket.emit(TURN_END, { roomId });
    }
  };

  const handleGuess = (guess) => {
    if (
      socket &&
      isConnected &&
      !gameState.isDrawing &&
      !gameState.hasGuessedCorrectly
    ) {
      socket.emit(GUESS_WORD, { roomId, word: guess, playerName });
    }
  };

  const handleBackToLobby = () => {
    navigate("/");
  };

  // Prevent multiple renders when turn changes
  const turnKey = `${gameState.currentRound}-${
    gameState.currentTurn || "none"
  }`;

  // Debug helper to see current state
  useEffect(() => {
    console.log("Current game state:", gameState);
  }, [gameState.currentRound, gameState.currentTurn]);

  // If game has ended, show game results
  if (gameState.isGameEnded) {
    return (
      <div className="game-end-container">
        <h1>Game Over!</h1>
        {gameState.winner && (
          <div className="winner-info">
            <h2>Winner: {gameState.winner.name}</h2>
            <p>Score: {gameState.winner.score}</p>
          </div>
        )}
        <div className="final-scores">
          <h3>Final Scores:</h3>
          <Scoreboard players={players} scores={gameState.scores} />
        </div>
        <button className="back-to-lobby-btn" onClick={handleBackToLobby}>
          Back to Lobby
        </button>
      </div>
    );
  }

  return (
    <div className="game-container">
      <div className="game-info">
        <div className="game-info-section">
          <div className="round-info">
            <h2>
              Round {currentRound} of {gameState.maxRounds}
            </h2>
            {currentRound > 0 && (
              <div className="round-progress">
                {Array.from({ length: gameState.maxRounds }).map((_, i) => (
                  <div
                    key={i}
                    className={`round-indicator ${
                      i + 1 <= currentRound ? "active" : ""
                    }`}
                    title={`Round ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
          <Timer
            key={`${currentRound}-${currentTurn}`}
            duration={60}
            onTimeUp={handleTimeUp}
          />
          <p className="current-turn">
            Current Turn:{" "}
            {currentTurn === socket?.id
              ? "You (Drawing)"
              : `${
                  players.find((p) => p.id === currentTurn)?.name ||
                  "Waiting..."
                } (Drawing)`}
          </p>
        </div>
      </div>

      <div className="game-content">
        <div className="scoreboard-section">
          <Scoreboard players={players} scores={gameState.scores} />
        </div>
        <div className="canvas-section">
          <Canvas
            isDrawing={isDrawer}
            wordToGuess={currentWord}
            roomId={roomId}
          />
        </div>
        <div className="chat-section">
          <Chat
            roomId={roomId}
            playerName={playerName}
            isDrawer={isDrawer}
            currentWord={currentWord}
          />
        </div>
      </div>
    </div>
  );
}
