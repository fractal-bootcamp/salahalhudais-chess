import express, { Express, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Server} from "socket.io"
import http from 'http';
import cors from 'cors';
import dotenv from "dotenv";
import { BoardState } from './setup';

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
app.use(cors({origin: 'http://localhost:5174', credentials: true}));


const server = http.createServer(app);
const PORT = 3000;

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5174",
    methods: ['GET', 'POST'],
    credentials: true, // cookies
  }
});


io.on('connection', (socket) => {
  // If there is a connection
  console.log("we have a connection!");
    socket.on('join_game', (data) => {
      console.log(`User ${data.userId} wants to join a game`);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
})





server.listen(3000, () => {
  console.log('Listening on *:3000')
});