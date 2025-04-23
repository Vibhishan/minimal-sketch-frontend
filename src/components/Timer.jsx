import React, { useState, useEffect, useRef } from "react";
import "../styles/Timer.css";

export default function Timer({ duration, onTimeUp }) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const timerRef = useRef(null);
  const hasCalledTimeUp = useRef(false);

  // Reset timer when duration changes
  useEffect(() => {
    console.log(`Timer reset with new duration: ${duration}`);
    setTimeLeft(duration);
    hasCalledTimeUp.current = false;
  }, [duration]);

  // Handle countdown logic
  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (timeLeft <= 0) {
      console.log("Timer reached zero!");
      if (!hasCalledTimeUp.current) {
        console.log("Calling onTimeUp function");
        hasCalledTimeUp.current = true;
        onTimeUp();
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        // Only log every 10 seconds to avoid flooding console
        if ((prev - 1) % 10 === 0 || prev <= 10) {
          console.log(`Timer: ${prev - 1} seconds left`);
        }
        return prev - 1;
      });
    }, 1000);

    // Cleanup on unmount or when timeLeft changes
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timeLeft, onTimeUp]);

  return <div className="timer">Time Left: {timeLeft}s</div>;
}
