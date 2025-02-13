import { useEffect, useState, useRef } from 'react'
import { BoardState } from '../../../chessEngine/chess'
import { io, Socket } from "socket.io-client"
import whitePawn from '../assets/pawn-w.svg'
import whiteRook from '../assets/rook-w.svg'
import whiteKnight from '../assets/knight-w.svg'
import whiteBishop from '../assets/bishop-w.svg'
import whiteQueen from '../assets/queen-w.svg'
import whiteKing from '../assets/king-w.svg'
import blackPawn from '../assets/pawn-b.svg'
import blackRook from '../assets/rook-b.svg'
import blackKnight from '../assets/knight-b.svg'
import blackBishop from '../assets/bishop-b.svg'
import blackQueen from '../assets/queen-b.svg'
import blackKing from '../assets/king-b.svg'
import { Pawn, Rook, Knight, Bishop, Queen, King } from '../../../chessEngine/chess'

// drone
// 

type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';


export default function ChessBoard() {
  const [boardState, setBoardState] = useState<BoardState>(new BoardState());
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);
  const [playerColor, setPlayerColor] = useState<'white' | 'black' | null>(null);
  const [gameId, setGameId] = useState< string | null>(null);
  const socketRef = useRef<Socket | null>(null);


  useEffect(() => {
    // Create socket connection
    socketRef.current = io("http://localhost:3000/");
    const socket = socketRef.current;
    
    socket.connect();
    socket.emit('join_game');

    const handlePlayerAssigned = ({ color, gameId }: any) => {
      console.log(`Assigned color: ${color}, Game ID: ${gameId}`);
      setPlayerColor(color);
      setGameId(gameId);
    };

    const handleGameStart = ({ board, players }: any) => {
      console.log("Game started!", players);
      const newBoard = new BoardState();
      newBoard.board = board.board.map((piece: any) => {
        if (!piece) return null;
        switch (piece.type) {
          case 'pawn':
            return new Pawn(piece.color);
          case 'rook':
            return new Rook(piece.color);
          case 'knight':
            return new Knight(piece.color);
          case 'bishop':
            return new Bishop(piece.color);
          case 'queen':
            return new Queen(piece.color);
          case 'king':
            return new King(piece.color);
          default:
            return null;
        }
      });
      setBoardState(newBoard);
    };

    const handleMoveMade = ({ color, nextTurn, board, from, to }: any) => {
      console.log(`Move made: ${color} moved from ${from} to ${to}`);
      console.log(`Next turn: ${nextTurn}`);
      
      setBoardState(prevBoard => {
        const newBoardState = new BoardState();
        if (!board || !Array.isArray(board.board)) {
          console.error('Invalid board state received:', board);
          return prevBoard;
        }
        
        newBoardState.board = board.board.map((piece: any) => {
          if (!piece) return null;
          switch (piece.type) {
            case 'pawn':
              return new Pawn(piece.color);
            case 'rook':
              return new Rook(piece.color);
            case 'knight':
              return new Knight(piece.color);
            case 'bishop':
              return new Bishop(piece.color);
            case 'queen':
              return new Queen(piece.color);
            case 'king':
              return new King(piece.color);
            default:
              return null;
          }
        });
        newBoardState.turn = nextTurn;
        return newBoardState;
      });
    };

    const handlePlayerDisconnected = ({ color }: { color: 'white' | 'black' }) => {
      // Handle disconnection logic
    };
    socket.on('player_assigned', handlePlayerAssigned);
    socket.on('game_start', handleGameStart);
    socket.on('move_made', handleMoveMade);
    socket.on('player_disconnected', handlePlayerDisconnected);

    return () => {
      socket.off('player_assigned', handlePlayerAssigned);
      socket.off('game_start', handleGameStart);
      socket.off('move_made', handleMoveMade);
      socket.off('player_disconnected', handlePlayerDisconnected);
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    console.log("Turn changed:", boardState.turn);
  }, [boardState]);

  useEffect(() => {
    console.log("Board state changed:", boardState.turn);
  }, [boardState]);

  // Board is initialized
  // W/ pieces placed on the 1-dimensional array

  // When selectedPiece is not null
  // Output the # of moves available
  // Highlight that in the rendering

  const handleSquareClick = (index: number) => {
    if (!socketRef.current) return;
    
    console.log(`Current turn: ${boardState.turn}, Player color: ${playerColor}`);
    
    if (boardState.turn !== playerColor || !gameId) {
      console.log("Not your turn or game hasn't started!");
      return;
    }

    if (selectedPiece === null) {
      const piece = boardState.board[index];
      if (piece && piece.color === playerColor) {
        setSelectedPiece(index);
      }
    } else {
      const targetPiece = boardState.board[index];
      if (targetPiece && targetPiece.color === playerColor) {
        setSelectedPiece(index);
        return;
      }
      socketRef.current.emit('make_move', {
        from: selectedPiece,
        to: index,
        gameId
      });
      console.log('Emitting move:', {
        from: selectedPiece,
        to: index,
        gameId
      });

      setSelectedPiece(null);
    }
  }

  const getPieceImage = (piece: { color: 'white' | 'black', type: PieceType }): string => {
    if (!piece) throw new Error("Piece is required");
    
    const pieceImages = {
      'white': {
        'pawn': whitePawn,
        'rook': whiteRook,
        'knight': whiteKnight,
        'bishop': whiteBishop,
        'queen': whiteQueen,
        'king': whiteKing
      },
      'black': {
        'pawn': blackPawn,
        'rook': blackRook,
        'knight': blackKnight,
        'bishop': blackBishop,
        'queen': blackQueen,
        'king': blackKing
      }
    } as const;

    return pieceImages[piece.color][piece.type.toLowerCase() as keyof (typeof pieceImages)['white']];
  };
  return (
    <div>
      <div className="player-control">
        <p>Current Player: {boardState.turn}</p>
      </div>
      <div className="chess-board">
        {boardState.board.map((piece, index) => {
          const row = 7 - Math.floor(index / 8);
          const col = index % 8;
          const isBlack = (row + col) % 2 === 1;

          return (
            <div
              key={index}
              className={`square ${isBlack ? 'black' : 'white'} ${selectedPiece == index ? 'selected' : ''}`}
              onClick={() => handleSquareClick(index)}
            >
              {piece && <img src={getPieceImage(piece)} alt={`${piece.color} ${piece.type?.toLowerCase()}`} className="chess-piece" />}
            </div>
          )
        })}
      </div>
    </div>
  )
}