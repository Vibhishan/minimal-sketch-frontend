import React from "react";
import "../styles/Scoreboard.css";

export default function Scoreboard({ players, scores }) {
  console.log("Scoreboard render:", { players, scores });

  return (
    <div className="scoreboard">
      <h3>Scoreboard</h3>
      <ul>
        {players &&
          players.map((player) => (
            <li key={player.id}>
              <span className="player-name">{player.name}</span>
              <span className="player-score">{scores[player.id] || 0} pts</span>
            </li>
          ))}
      </ul>
    </div>
  );
}
