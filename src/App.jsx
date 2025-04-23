import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { SocketProvider } from "./context/SocketContext";
import LandingPage from "./components/LandingPage";
import WaitingRoom from "./components/WaitingRoom";
import Game from "./components/Game";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import "./App.css";

function App() {
  return (
    <SocketProvider>
      <Router>
        <div className="app">
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/waiting-room" element={<WaitingRoom />} />
              <Route path="/game" element={<Game />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </SocketProvider>
  );
}

export default App;
