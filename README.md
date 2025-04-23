# Minimal Sketch - A Real-time Drawing Game

Minimal Sketch is a multiplayer drawing and guessing game where players take turns drawing while others try to guess the word. Built with React, Socket.io, and Vite.

## Features

- Real-time multiplayer gameplay
- Drawing canvas with multiple tools (pencil, eraser)
- Live chat functionality

## Project Structure

```
src/
├── components/
│   ├── Canvas.jsx        # Drawing functionality
│   ├── Chat.jsx          # Real-time chat
│   ├── Game.jsx          # Main game component
│   ├── LandingPage.jsx   # Entry point
│   ├── Scoreboard.jsx    # Player scores
│   ├── Timer.jsx         # Game timer
│   ├── WaitingRoom.jsx   # Game lobby
│   └── layout/           # Layout components
├── styles/               # CSS styles
└── context/             # React context providers
```

## Tech Stack

- React 19
- Vite 6
- Socket.io Client 4.8
- React Router 6
- ESLint 9

## Getting Started

### Prerequisites

- Node.js (Latest LTS version recommended)
- npm or yarn

### Installation

1. Clone the repository

```bash
git clone git@github.com:Vibhishan/minimal-sketch-frontend.git
cd minimal-sketch-frontend
```

2. Install dependencies

```bash
npm install
# or
yarn install
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Development

1. Start the development server:

```bash
npm run dev
```

2. Open your browser and navigate to `http://localhost:5173`

## Game Flow

1. Players join through the Landing Page
2. Enter Waiting Room to start a game
3. Game starts with players taking turns:
   - One player draws while others guess
   - Timer counts down for each turn
   - Points awarded for correct guesses

## Component Details

### Canvas.jsx

- Drawing functionality with pencil and eraser tools
- Color and line width customization
- Real-time stroke synchronization
- Touch and mouse support

### Chat.jsx

- Real-time messaging
- Special styling for correct/incorrect guesses
- Player name display

### Game.jsx

- Main game logic and state management
- Turn management
- Player role assignment (drawer/guesser)

### Scoreboard.jsx

- Clean, modern design

### Timer.jsx

- Countdown timer for each turn
- Visual feedback
- Time-up event handling

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Future Features & Improvements

### Gameplay Enhancements

- Round-based gameplay with multiple rounds per game
- Final scores display at game end
- Player ranking system with leaderboards
- Custom word suggestions from players
- Different game modes (e.g., speed drawing, team play)
- Power-ups and special abilities

### Drawing Features

- More drawing tools (brush, spray, shapes)
- Undo/Redo functionality
- Background color selection
- Save and share drawings
- Drawing templates or stencils
- Layer support for complex drawings

### Social Features

- Player profiles and avatars
- Friend system and private rooms
- Emoji reactions to drawings
- Voice chat integration
- Spectator mode
- Replay system for past games

### Technical Improvements

- Responsive design for all screen sizes
- Offline mode with local storage
- Performance optimizations for large rooms
- Better error handling and recovery
- Analytics and game statistics
- Dark mode support

### Accessibility

- Screen reader support
- Keyboard shortcuts
- High contrast mode
- Colorblind-friendly palette
- Adjustable font sizes
- Reduced motion options

### Security & Moderation

- Report system for inappropriate content
- Word filtering and moderation
- Room password protection
- Anti-cheat measures
- User verification system
- Automated content moderation
