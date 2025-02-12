import { useEffect, useState } from 'react'
import { BoardState } from '../../../Chess Engine/src/setup'
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

// assume human is always white

type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';

export default function ChessBoard() {
  const [boardState, setBoardState] = useState<BoardState>(new BoardState());
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<'white' | 'black'>('white');

  useEffect(() => {
    const newBoard  = new BoardState();
    setBoardState(newBoard);
  }, []);


  // Board is initialized
  // W/ pieces placed on the 1-dimensional array

  // When selectedPiece is not null
  // Output the # of moves available
  // Highlight that in the rendering

  const handleSquareClick = (index: number) => {
    if (selectedPiece === null) {
      const piece = boardState.getBoard()[index];
      if (piece && piece.color === currentPlayer) {
        console.log(`${piece.color} ${piece.type}`);
        setSelectedPiece(index);
      }
    } else {
      const targetPiece = boardState.getBoard()[index];
      if (targetPiece && targetPiece.color === currentPlayer) {
        setSelectedPiece(index);
        return;
      }
      console.log(selectedPiece, index);
      const newBoardState = new BoardState();
      newBoardState.board = [...boardState.getBoard()];
      newBoardState.turn = currentPlayer;
      
      const moveSuccessful = newBoardState.makeMove(selectedPiece, index);
      console.log("Move successful:", moveSuccessful);
      
      if (moveSuccessful) {
        setBoardState(newBoardState);
        setCurrentPlayer(currentPlayer === 'white' ? 'black' : 'white');
      }

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
        <p>Current Player: {currentPlayer}</p>
      </div>
      <div className="chess-board">
        {boardState.getBoard().map((piece, index) => {
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