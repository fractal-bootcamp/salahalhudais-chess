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
}

const games = new Map<string, Game>();
let disconnectedGames = new Map<string, Game>();

const app = express();
app.use(cors({origin: ["https://salschess.netlify.app", 'http://localhost:5173'], credentials: true}));


const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

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
  // If there is a connection
  console.log("we have a connection!");
    socket.on('join_game', () => {
      console.log(`User wants to join a game`);

      let gameId: string;
      let game = findAvailableGames();

      // No games are available
      if(!game) {
        gameId = uuidv4();

        game = {
          gameId, 
          board: new BoardState(),
          players: {},
          status: 'waiting',
        }

        games.set(gameId, game);
      } else {
        gameId = game.gameId;
      }
      // Okay, we've got a game, whether it existed or it didn't...
      // Now set the player
      const color = !game.players.white ? 'white' : 'black';
      game.players[color] = {
        socketId: socket.id,
        color
      }
      socket.join(gameId);

      socket.emit("player_assigned", { color, gameId});

      
      if (game.players.black && game.players.white) {
        game.status = 'ongoing';
        io.to(gameId).emit('game_start', {
          gameId,
          board: game.board,
          players: game.players
        })
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
        let isWhite = game.players.white?.socketId === socket.id;
        let isBlack = game.players.black?.socketId === socket.id;
        

        if (isWhite || isBlack) {
          // Instead of marking as completed, store it
          disconnectedGames.set(gameId, game);
          games.delete(gameId);
          
          io.to(gameId).emit('player_disconnected', {
            color: isWhite ? "white" : "black"
          });
        }
      }
      console.log('User disconnected');
    });
})

server.listen(3000, () => {
  console.log(`Listening on http://localhost:3000/`)
});
