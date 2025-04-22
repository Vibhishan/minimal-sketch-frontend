import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { SocketProvider } from "./context/SocketContext";
import LandingPage from "./components/LandingPage";
import WaitingRoom from "./components/WaitingRoom";
import Game from "./components/Game";
import "./App.css";

function App() {
  return (
    <SocketProvider>
      <Router>
        <div className="app">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/waiting-room" element={<WaitingRoom />} />
            <Route path="/game" element={<Game />} />
          </Routes>
        </div>
      </Router>
    </SocketProvider>
  );
}

export default App;
