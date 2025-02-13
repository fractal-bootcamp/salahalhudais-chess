import express, { Express, Request, Response } from 'express';
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
  let availableGame: Game | null = null;
  games.forEach((value, key) => {
    if (value.status === 'waiting') {
      availableGame = value;
    }
  });
  return availableGame;
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
      // find game
      let game = games.get(gameId);
      if (!game) {
        socket.emit('error', {message: 'Game not found!'});
        return;
      }

      // find who wants to make a move
      let player = Object.values(game.players).find((p) => p.socketId === socket.id);
      if (!player) {
        socket.emit("error", {message: "Player not found"});
        return;
      }

      if (game.board.makeMove(from, to)) {
        io.to(gameId).emit('move_made', {
          from,
          to,
          gameId,
          color: player.color,
          nextTurn: game.board.turn,
          board: game.board
        });
      }
    }) 
    socket.on('disconnect', () => {
      // find the game and remove it, while making sure it had players. 
      for (const [gameId, game] of games) {
        let isWhite = game.players.white?.socketId === socket.id;
        let isBlack = game.players.black?.socketId === socket.id;
        

        if (isWhite || isBlack) {
          game.status = 'completed';
          io.to(gameId).emit('player_disconnected',{
            color: isWhite ? "white" : "black"
          });

          setTimeout(() => games.delete(gameId), 5000);
        }
      }
      console.log('User disconnected');
    });
})

server.listen(3000, () => {
  console.log('Listening on *:3000')
});
