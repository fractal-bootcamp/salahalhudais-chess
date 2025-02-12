import express, { Express, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Server} from "socket.io"
import http from 'http';
import cors from 'cors';
import dotenv from "dotenv";
import { BoardState } from './setup';
import { isBooleanObject } from 'util/types';

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

const app = express();
app.use(cors({origin: 'http://localhost:5173', credentials: true}));


const server = http.createServer(app);
const PORT = 3000;

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ['GET', 'POST'],
    credentials: true, // cookies
  }
});

const findAvailableGames = (): Game | null => {
  for (const [_, game] of games) {
    if (game.status === 'waiting' && 
        (!game.players.white || !game.players.black)) {
      return game;
    }
  }
  return null;
};

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  socket.on('join_game', () => {
    console.log(`User ${socket.id} wants to join a game`);

    let game = findAvailableGames();
    let gameId: string;
    if (!game) {
      gameId = uuidv4();
      game = {
        gameId,
        board: new BoardState(),
        players: {},
        status: 'waiting',
      };
      games.set(gameId, game);
      console.log(`Created new game: ${gameId}`);
    } else {
      gameId = game.gameId;
      console.log(`Joining existing game: ${gameId}`);
    }
    const color = !game.players.white ? 'white' : 'black';
    game.players[color] = {
      socketId: socket.id,
      color,
    };
    
    socket.join(gameId);
    console.log(`Player ${socket.id} assigned ${color} in game ${gameId}`);
    socket.emit('player_assigned', { color, gameId });
    if (game.players.white && game.players.black) {
      console.log(`Game ${gameId} starting with both players`);
      game.status = 'ongoing';
      const serializedBoard = {
        board: game.board.getBoard().map(piece => {
          if (!piece) return null;
          return {
            type: piece.type,
            color: piece.color
          };
        })
      };
      
      io.to(gameId).emit('game_start', {
        gameId,
        board: serializedBoard,
        players: game.players
      });
    }
  });

  socket.on("make_move", ({ from, to, gameId }) => {
    console.log(`Attempting move from ${from} to ${to} in game ${gameId}`);
    let game = games.get(gameId);
    console.log(game);
    if (!game) {
        socket.emit('error', {message: 'Game not found!'});
        return;
    }

    let player = Object.values(game.players).find((p) => p.socketId === socket.id);
    if (!player) {
        socket.emit("error", {message: "Player not found"});
        return;
    }

    // Validate it's the player's turn
    if (game.board.turn !== player.color) {
        socket.emit("error", {message: "Not your turn"});
        return;
    }
    const moveSuccessful = game.board.makeMove(from, to);
    if (moveSuccessful) {
        io.to(gameId).emit('move_made', {
            from,
            to,
            gameId,
            color: player.color,
            nextTurn: game.board.turn,
            board: game.board.getBoard().map(piece => {
                if (!piece) return null;
                return {
                    type: piece.type,
                    color: piece.color
                };
            })
        });
    } else {
        socket.emit("error", {message: "Invalid move"});
    }
  });

  socket.on('disconnect', () => {
    for (const [gameId, game] of games) {
      const isWhite = game.players.white?.socketId === socket.id;
      const isBlack = game.players.black?.socketId === socket.id;
      
      if (isWhite || isBlack) {
        game.status = 'completed';
        io.to(gameId).emit('player_disconnected', {
          color: isWhite ? 'white' : 'black'
        });
        setTimeout(() => games.delete(gameId), 5000);
      }
    }
    console.log('User disconnected');
  });
});

server.listen(3000, () => {
  console.log('Listening on *:3000')
});
