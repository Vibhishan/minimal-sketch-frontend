import React from "react";

const Header = () => {
  return (
    <header className="start-navbar">
      <div className="navbar-title">Minimal Sketch</div>
      <a
        href="https://github.com/Vibhishan/minimal-sketch-frontend"
        target="_blank"
        rel="noopener noreferrer"
      >
        <button className="repo-button">View Repository</button>
      </a>
    </header>
  );
};

export default Header;
