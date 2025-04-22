import React, { useState, useEffect, useContext } from "react";
import { useLocation } from "react-router-dom";
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
  ROOM_STATE_UPDATE,
} from "../constants/webSocketEvents";
import Canvas from "./Canvas";
import Chat from "./Chat";
import Timer from "./Timer";
import Scoreboard from "./Scoreboard";
import "../styles/Game.css";

export default function Game() {
  const location = useLocation();
  const { roomId, playerName, players: initialPlayers } = location.state;
  const { socket, isConnected, joinRoom } = useContext(SocketContext);
  const [players, setPlayers] = useState(initialPlayers || []);
  const [gameState, setGameState] = useState({
    currentRound: 0,
    currentTurn: null,
    scores: {},
    wordToGuess: null,
    isDrawing: false,
    timeLeft: 60,
  });

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

    // Listen for room state updates
    socket.on(ROOM_STATE_UPDATE, (data) => {
      console.log("Room state update:", data);
      if (data && data.players) {
        setPlayers(data.players);
        setGameState((prev) => ({
          ...prev,
          scores: data.players.reduce((acc, player) => {
            acc[player.id] = player.score || 0;
            return acc;
          }, {}),
        }));
      }
    });

    socket.on(GAME_STARTED, () => {
      setGameState((prev) => ({ ...prev, currentRound: 1 }));
    });

    socket.on(ROUND_START, (data) => {
      setGameState((prev) => ({ ...prev, currentRound: data.round }));
    });

    socket.on(TURN_START, (data) => {
      setGameState((prev) => ({
        ...prev,
        currentTurn: data.playerId || data.currentTurn,
        isDrawing: (data.playerId || data.currentTurn) === socket.id,
        timeLeft: 60,
      }));
    });

    socket.on(SCORE_UPDATE, (data) => {
      console.log("Score update:", data);
      if (data && data.players) {
        setPlayers(data.players);
        setGameState((prev) => ({
          ...prev,
          scores: data.players.reduce((acc, player) => {
            acc[player.id] = player.score || 0;
            return acc;
          }, {}),
        }));
      }
    });

    socket.on(WORD_SELECTED, (data) => {
      setGameState((prev) => ({ ...prev, wordToGuess: data.word }));
    });

    return () => {
      socket.off(PLAYER_JOINED);
      socket.off(ROOM_STATE_UPDATE);
      socket.off(GAME_STARTED);
      socket.off(ROUND_START);
      socket.off(TURN_START);
      socket.off(SCORE_UPDATE);
      socket.off(WORD_SELECTED);
    };
  }, [socket, isConnected, roomId, playerName, joinRoom]);

  const handleTimeUp = () => {
    if (socket && isConnected) {
      socket.emit(TURN_END, { roomId });
    }
  };

  return (
    <div className="game-container">
      <div className="game-header">
        <h2>Round {gameState.currentRound}</h2>
        <Timer duration={gameState.timeLeft} onTimeUp={handleTimeUp} />
        <p>
          Current Turn:{" "}
          {gameState.currentTurn === socket?.id
            ? "You"
            : players.find((p) => p.id === gameState.currentTurn)?.name}
        </p>
        {gameState.isDrawing && <p>Word to Draw: {gameState.wordToGuess}</p>}
        <Scoreboard players={players} scores={gameState.scores} />
      </div>
      <div className="game-content">
        <Canvas
          isDrawing={gameState.isDrawing}
          wordToGuess={gameState.wordToGuess}
        />
        <div className="game-sidebar">
          <Chat playerName={playerName} />
        </div>
      </div>
    </div>
  );
}
