# Chess Analysis App with Next.js

This is a Next.js application for analyzing chess games from Lichess and Chess.com. The app allows users to input their username, fetch their recent games, select a game for analysis, and receive AI-powered insights about critical moments in the game.

## Features

- Fetch games from Lichess and Chess.com
- Select games to analyze
- AI-powered analysis of critical moments
- Interactive chess board visualization
- Text-to-speech audio analysis
- Responsive design for desktop and mobile

## Tech Stack

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe code
- **Tailwind CSS**: Utility-first CSS framework
- **Chess.js**: Chess logic library
- **React Chessboard**: Chess board visualization
- **OpenAI API**: For game analysis
- **ElevenLabs API**: For text-to-speech
- **Zustand**: State management

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn
- OpenAI API key
- ElevenLabs API key (optional, for voice analysis)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/nextjs-chess-app.git
   cd nextjs-chess-app
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env.local` file with your API keys:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Select a platform (Lichess or Chess.com)
2. Enter your username
3. Select a game from your recent games
4. Click "Analyze Game" to start the analysis
5. Navigate through the critical moments
6. Toggle voice analysis for audio commentary

## Deployment

The app can be deployed on Vercel:

```bash
npm run build
# or
yarn build
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Original Python application that this project was migrated from
- Lichess and Chess.com for their APIs
- OpenAI for analysis capabilities
- ElevenLabs for text-to-speech