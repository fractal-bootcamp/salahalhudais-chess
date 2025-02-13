import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Server} from "socket.io"
import http from 'http';
import cors from 'cors';
import dotenv from "dotenv";
import { BoardState } from './chess';

dotenv.config();

interface Player {
  socketId: string;
  color: 'white' | 'black';
  userName?: string;
}
interface Game {
  gameId: string;
  board: BoardState;
  players: {
    white?: Player;
    black?: Player;
  };
  status: 'waiting' | 'ongoing' | 'completed';
  lastActive: number;
}

const GAME_TIMEOUT = 1000 * 60 * 5; // 5 minutes
const games = new Map<string, Game>();
const disconnectedGames = new Map<string, Game>();

// Add a cleanup function for stale games
const cleanupStaleGames = () => {
  const now = Date.now();
  for (const [gameId, game] of disconnectedGames) {
    if (now - game.lastActive > GAME_TIMEOUT) {
      console.log(`Removing stale game: ${gameId}`);
      disconnectedGames.delete(gameId);
    }
  }
};

// Run cleanup every minute
setInterval(cleanupStaleGames, 60000);

const app = express();
app.use(cors({
  origin: ["https://salschess.netlify.app", 'http://localhost:5173'], 
  credentials: true
}));

// Add a basic health check route
app.get('/', (req, res) => {
  res.send('Chess server is running!');
});

const server = http.createServer(app);
const PORT = process.env.PORT || 4000

const io = new Server(server, {
  cors: {
    origin: ["https://salschess.netlify.app", "http://localhost:5173"],
    methods: ['GET', 'POST'],
    credentials: true, // cookies
  }
});

const findAvailableGames = (): Game | null => {
  // First check disconnected games
  for (const [gameId, game] of disconnectedGames) {
    if (!game.players.white || !game.players.black) {
      return game;
    }
  }
  
  // Then check active games
  for (const [_, game] of games) {
    if (game.status === 'waiting') {
      return game;
    }
  }
  return null;
}

io.on('connection', (socket) => {
  console.log("New connection:", socket.id);
  
  socket.on('join_game', () => {
    console.log(`User ${socket.id} wants to join a game`);

    let gameId: string;
    let game = findAvailableGames();

    if(!game) {
      gameId = uuidv4();
      game = {
        gameId, 
        board: new BoardState(),
        players: {},
        status: 'waiting',
        lastActive: Date.now()
      }
      games.set(gameId, game);
    } else {
      gameId = game.gameId;
      game.lastActive = Date.now();
      
      // Move game back to active games if it was disconnected
      if (disconnectedGames.has(gameId)) {
        games.set(gameId, game);
        disconnectedGames.delete(gameId);
        console.log(`Restored game ${gameId} from disconnected games`);
      }
    }

    const color = !game.players.white ? 'white' : 'black';
    game.players[color] = {
      socketId: socket.id,
      color
    };
    
    socket.join(gameId);
    socket.emit("player_assigned", { color, gameId });

    if (game.players.black && game.players.white) {
      game.status = 'ongoing';
      io.to(gameId).emit('game_start', {
        gameId,
        board: game.board,
        players: game.players
      });
    }
  });

  socket.on("make_move", ({ from, to, gameId }) => {
    console.log(`Move request received - from: ${from}, to: ${to}, gameId: ${gameId}`);
    
    let game = games.get(gameId);
    if (!game) {
        console.log('Game not found:', gameId);
        socket.emit('error', {message: 'Game not found!'});
        return;
    }

    let player = Object.values(game.players).find((p) => p.socketId === socket.id);
    if (!player) {
        console.log('Player not found for socket:', socket.id);
        socket.emit("error", {message: "Player not found"});
        return;
    }

    console.log(`Current board turn: ${game.board.turn}, Player color: ${player.color}`);
    
    if (game.board.makeMove(from, to)) {
        console.log(`Move successful - Emitting move_made event`);
        io.to(gameId).emit('move_made', {
            from,
            to,
            gameId,
            color: player.color,  
            nextTurn: game.board.turn,
            board: game.board
        });
    } else {
        console.log('Move failed');
        socket.emit("error", {message: "Invalid move"});
    }
  }) 
  socket.on('disconnect', () => {
    for (const [gameId, game] of games) {
      const isWhite = game.players.white?.socketId === socket.id;
      const isBlack = game.players.black?.socketId === socket.id;

      if (isWhite || isBlack) {
        game.lastActive = Date.now();
        disconnectedGames.set(gameId, game);
        games.delete(gameId);
        
        io.to(gameId).emit('player_disconnected', {
          color: isWhite ? "white" : "black"
        });
        
        console.log(`Player ${socket.id} disconnected from game ${gameId}`);
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}/`)
});
