import React, { useState, useEffect } from "react";
import "../styles/Timer.css";

export default function Timer({ duration, onTimeUp }) {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else {
      onTimeUp();
    }
  }, [timeLeft, onTimeUp]);

  return <div className="timer">Time Left: {timeLeft}s</div>;
}
