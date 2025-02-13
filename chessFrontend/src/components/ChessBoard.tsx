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
  const [gameId, setGameId] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io("http://localhost:4000");
    socketRef.current = socket;

    socket.on('player_assigned', ({ color, gameId }) => {
      setPlayerColor(color);
      setGameId(gameId);
    });

    socket.on('game_start', ({ board }) => {
      const newBoard = new BoardState();
      newBoard.board = reconstructPieces(board.board);
      newBoard.turn = board.turn;
      setBoardState(newBoard);
    });

    socket.on('move_made', ({ board, nextTurn }) => {
      setBoardState(prev => {
        const newBoard = new BoardState();
        newBoard.board = reconstructPieces(board.board);
        newBoard.turn = nextTurn;
        return newBoard;
      });
    });

    socket.emit('join_game');

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleSquareClick = (index: number) => {
    if (!playerColor || !gameId || boardState.turn !== playerColor) return;
    
    if (selectedPiece === null) {
      const piece = boardState.board[index];
      if (piece?.color === playerColor) setSelectedPiece(index);
    } else {
      if (boardState.isValidMove(selectedPiece, index)) {
        socketRef.current?.emit('make_move', {
          from: selectedPiece,
          to: index,
          gameId
        });
      }
      setSelectedPiece(null);
    }
  };

  const getPieceImage = (piece: { color: 'white' | 'black', type: PieceType } | null): string | null => {
    if (!piece) return null;
    
    const pieceImages = {
      white: {
        pawn: whitePawn,
        rook: whiteRook,
        knight: whiteKnight,
        bishop: whiteBishop,
        queen: whiteQueen,
        king: whiteKing
      },
      black: {
        pawn: blackPawn,
        rook: blackRook,
        knight: blackKnight,
        bishop: blackBishop,
        queen: blackQueen,
        king: blackKing
      }
    };
    
    return pieceImages[piece.color][piece.type];
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

function reconstructPieces(board: any[]) {
  return board.map(piece => {
    if (!piece) return null;
    const color = piece.color;
    switch (piece.type) {
      case 'pawn': return new Pawn(color);
      case 'rook': return new Rook(color);
      case 'knight': return new Knight(color);
      case 'bishop': return new Bishop(color);
      case 'queen': return new Queen(color);
      case 'king': return new King(color);
      default: return null;
    }
  });
}