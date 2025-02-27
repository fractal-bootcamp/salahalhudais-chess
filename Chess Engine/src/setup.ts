abstract class ChessPiece {
  public color: 'white' | 'black';
  public type: 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';

  constructor(color: 'white' | 'black', type: 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king') {
    this.color = color;
    this.type = type;
  }

  abstract generate(board: BoardState, index: number): number[];
}

interface generateMoves {
  generate(board: BoardState, index: number): number[];
}

class Pawn extends ChessPiece implements generateMoves {
  private justMadeTwoSquareMove = false;
  private hasMoved = false;
  constructor(color: 'white' | 'black') {
    super(color, 'pawn')
  }

  generate(board: BoardState, index: number): number[] {
    let moves: number[] = [];
    
    if(this.color === "white") {
      if (board.getBoard()[index - 8] === null) {
        moves.push(index - 8);
        if(!this.hasMoved && board.getBoard()[index - 16] === null) {
          moves.push(index - 16);
        }
      }

      if (board.getBoard()[index - 7]?.color === 'black') {
        moves.push(index - 7);
      }
      if (board.getBoard()[index - 9]?.color === 'black') {
        moves.push(index - 9);
      }

      if (board.getBoard()[index + 1]?.color === 'black' &&
          board.getBoard()[index + 1] instanceof Pawn &&
          (board.getBoard()[index + 1] as Pawn).justMadeTwoSquareMove) {
            moves.push(index - 7);
      }
      if (board.getBoard()[index - 1]?.color === 'black' &&
          board.getBoard()[index - 1] instanceof Pawn &&
          (board.getBoard()[index - 1] as Pawn).justMadeTwoSquareMove) {
            moves.push(index - 9);
      }

    } else { 
      if (board.getBoard()[index + 8] === null) {
        moves.push(index + 8);
        if(!this.hasMoved && board.getBoard()[index + 16] === null) {
          moves.push(index + 16);
        }
      }

      if (board.getBoard()[index + 7]?.color === 'white') {
        moves.push(index + 7);
      }
      if (board.getBoard()[index + 9]?.color === 'white') {
        moves.push(index + 9);
      }
      if (board.getBoard()[index + 1]?.color === 'white' &&
          board.getBoard()[index + 1] instanceof Pawn &&
          (board.getBoard()[index + 1] as Pawn).justMadeTwoSquareMove) {
            moves.push(index + 9);
      }
      if (board.getBoard()[index - 1]?.color === 'white' &&
          board.getBoard()[index - 1] instanceof Pawn &&
          (board.getBoard()[index - 1] as Pawn).justMadeTwoSquareMove) {
            moves.push(index + 7);
      }
    }
    return moves;
  }
}
class Knight extends ChessPiece implements generateMoves {
  constructor(color: 'white' | 'black') {
    super(color, 'knight')
  }

  generate(board: BoardState, index: number): number[] {
    let moves: number[] = []
    let directions: number[][] = [
      [1, 2],
      [2, 1],
      [-1, 2],
      [-2, 1],
      [1, -2],
      [2, -1],
      [-1, -2], 
      [-2, -1]
    ]
    let col = index % 8;
    let row = Math.floor(index / 8);

    for(let pair of directions) {
      let newCol = col + pair[1];
      let newRow = row + pair[0];

      if (newCol >= 0 && newCol <= 7 && newRow >= 0 && newRow <= 7) {
        let target = 8 * newRow + newCol;
        if (board.getBoard()[target] === null || board.getBoard()[target]?.color !== this.color) {
          moves.push(target);
        } 
      }
    }
  return moves;
  }
}

class Bishop extends ChessPiece implements generateMoves {
  constructor(color: 'white' | 'black') {
    super(color, 'bishop')
  }

  generate(board: BoardState, index: number): number[] {
    x Generate a bunch of possible moves that can be made from the current board State. We can then use this as a prefix
    // to every move. For every piece, it will contain it's own state of possible moves.
    

    let moves: number[] = []

    let col = index % 8;
    let row = Math.floor(index / 8)

    /*

    Okay, Diagonal:
          top right -> - 7
          top left -> - 9
          bottom left -> + 7
          bottom right -> + 9 
    */

    const loop = (index: number, dxdy: number): void => {
      if (index < 0 || index > 63) return;
      let newIdx = index + dxdy;
      if (newIdx !== index) {
        let target = board.getBoard()[newIdx];

        if (board.getBoard()[newIdx]?.color === this.color) {
            return;
          } else if (target && target.color !== this.color) {
              moves.push(newIdx);
              return;
          } else if (target === null) {
            moves.push(newIdx);
            }
        }
        loop(newIdx, dxdy);
    }
      /*
      completely wrong, causes zigzagging
      loop(col - 1, row -1);
      loop(col+1, row -1);
      loop(col -1, row + 1);
      loop(col + 1, row + 1); */

      // Loop: 61 -> 52
      // col -> 5
      // row -> 7
      // dx -> -1 dy -> -1
      // 
    loop(index, -7);
    loop(index, -9)
    loop(index, 7)
    loop(index, 9)
    return moves;

  }
}

class Rook extends ChessPiece implements generateMoves {
  constructor(color: 'white' | 'black') {
    super(color, 'rook')
  }

  generate(board: BoardState, index: number): number[] {
    let moves: number[] = [];
    const currentCol = index % 8;
    const currentRow = Math.floor(index / 8);
    for (let col = 0; col < 8; col++) {
        if (col === currentCol) continue;
        const newIndex = currentRow * 8 + col;
        const targetPiece = board.getBoard()[newIndex];
        if (targetPiece?.color === this.color) {
            if (col < currentCol) continue;
            else break;
        }
        
        moves.push(newIndex);
        
        if (targetPiece !== null) {
            if (col < currentCol) continue;
            else break;
        }
    }
    for (let row = 0; row < 8; row++) {
        if (row === currentRow) continue;
        const newIndex = row * 8 + currentCol;
        const targetPiece = board.getBoard()[newIndex];
        
        if (targetPiece?.color === this.color) {
            if (row < currentRow) continue;
            else break;
        }
        
        moves.push(newIndex);
        
        if (targetPiece !== null) {
            if (row < currentRow) continue;
            else break;
        }
    }

    return moves;
  }
}

class Queen extends ChessPiece implements generateMoves {
  constructor(color: 'white' | 'black') {
    super(color, 'queen')
  }

  generate(board: BoardState, index: number): number[] {
    let moves: number[] = [];
    const currentCol = index % 8;
    const currentRow = Math.floor(index / 8);
    for (let col = 0; col < 8; col++) {
        if (col === currentCol) continue;
        const newIndex = currentRow * 8 + col;
        const targetPiece = board.getBoard()[newIndex];
        if (targetPiece?.color === this.color) {
            if (col < currentCol) continue;
            else break;
        }
        
        moves.push(newIndex);
        if (targetPiece !== null) {
            if (col < currentCol) continue;
            else break;
        }
    }

    for (let row = 0; row < 8; row++) {
        if (row === currentRow) continue;
        const newIndex = row * 8 + currentCol;
        const targetPiece = board.getBoard()[newIndex];
        if (targetPiece?.color === this.color) {
            if (row < currentRow) continue; 
            else break;
        }
        
        moves.push(newIndex);
        if (targetPiece !== null) {
            if (row < currentRow) continue;
            else break;
        }
    }
    const directions = [
        [-1, -1],
        [-1, 1],  
        [1, -1],
        [1, 1]    
    ];

    for (const [rowDir, colDir] of directions) {
        let newRow = currentRow + rowDir;
        let newCol = currentCol + colDir;

        while (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
            const newIndex = newRow * 8 + newCol;
            const targetPiece = board.getBoard()[newIndex];

            if (targetPiece?.color === this.color) break;
            
            moves.push(newIndex);
            
            if (targetPiece !== null) break;
            
            newRow += rowDir;
            newCol += colDir;
        }
    }

    return moves;
  }
}

class King extends ChessPiece implements generateMoves {
  constructor(color: 'white' | 'black') {
    super(color, 'king')
  }

  generate(board: BoardState, index: number): number[] {
    // Generate a bunch of possible moves that can be made from the current board State. We can then use this as a prefix
    // to every move. For every piece, it will contain it's own state of possible moves. 
    let moves: number[] = []
    const currentCol = index % 8;
    const currentRow = Math.floor(index / 8);
    const directions = [
      [-1,-1], [0,-1], [1,-1], [1,0], [1,1], [0,1], [-1,1], [-1,0]
    ]
    for (let [dx,dy] of directions) {
      let newCol = currentCol + dx;
      let newRow = currentRow + dy;

      if(newRow >= 0 && newRow <= 7 && newCol >= 0 && newCol <= 7) {
        const newIndex = newRow * 8 + newCol;
        const targetPiece = board.getBoard()[newIndex];

        if (targetPiece === null || targetPiece?.color !== this.color) {
          moves.push(newIndex);
        } 
      }
    }
    return moves;
  }
}

const algebraicToIndex = (index: String): number => {
  if (index.length > 2 || index.length < 2) {
    throw new Error("Invalid move structure: " + index)
  }
  const columns: { [key: string]: number } = {
    'a': 0,
    'b': 1,
    'c': 2,
    'd': 3,
    'e': 4,
    'f': 5,
    'g': 6,
    'h': 7,
  }
  
  const rows: { [key: string]: number } = {
    '8': 0,
    '7': 1,
    '6': 2,
    '5': 3,
    '4': 4,
    '3': 5,
    '2': 6,
    '1': 7,
  };
  const x = columns[index[0].toLowerCase()];
  const y = rows[index[1]];
  const idx = 8 * y + x;

  return idx;
}

class BoardState {
  public board: Array<ChessPiece | null> = [];
  private castlingPrivilegeWhite = true;
  private castlingPrivilegeBlack = true;
  private whitePieces: [
    King,
    Queen,
    Bishop,
    Bishop,
    Knight,
    Knight,
    Rook,
    Rook,
    Pawn,
    Pawn,
    Pawn,
    Pawn,
    Pawn,
    Pawn,
    Pawn,
    Pawn
  ] = [] as any;
  private blackPieces: [
    King,
    Queen,
    Bishop,
    Bishop,
    Knight,
    Knight,
    Rook,
    Rook,
    Pawn,
    Pawn,
    Pawn,
    Pawn,
    Pawn,
    Pawn,
    Pawn,
    Pawn
  ] = [] as any;
  private turn;

  constructor() {
    this.turn = "white";
    this.board = new Array(64).fill(null);
    this.whitePieces = [
      new King('white'),
      new Queen('white'),
      new Bishop('white'),
      new Bishop('white'), 
      new Knight('white'),
      new Knight('white'),
      new Rook('white'),
      new Rook('white'),
      new Pawn('white'),
      new Pawn('white'),
      new Pawn('white'),
      new Pawn('white'),
      new Pawn('white'),
      new Pawn('white'),
      new Pawn('white'),
      new Pawn('white'),
    ]
    this.blackPieces = [
      new King('black'),
      new Queen('black'),
      new Bishop('black'),
      new Bishop('black'),
      new Knight('black'),
      new Knight('black'),
      new Rook('black'),
      new Rook('black'),
      new Pawn('black'),
      new Pawn('black'),
      new Pawn('black'),
      new Pawn('black'),
      new Pawn('black'),
      new Pawn('black'),
      new Pawn('black'),
      new Pawn('black')
    ]

    const whitePositions = [
      'e1', 
      'd1', 
      'c1', 'f1',
      'b1', 'g1',
      'a1', 'h1',
      'a2', 'b2', 'c2', 'd2', 'e2', 'f2', 'g2', 'h2'
    ];
    
    const blackPositions = [
      'e8',
      'd8',
      'c8', 'f8',
      'b8', 'g8',
      'a8', 'h8',
      'a7', 'b7', 'c7', 'd7', 'e7', 'f7', 'g7', 'h7',
    ];

    for(let i = 0; i < 16; i++) {
      this.board[algebraicToIndex(whitePositions[i])] = this.whitePieces[i];
      this.board[algebraicToIndex(blackPositions[i])] = this.blackPieces[i];
    }
  }

  // MakeMove function to change board State
  // isValidMove to check if valid move
  // switchTurn

  private isValidMove(from: number, to: number): boolean {
    const tempBoard = [...this.board];
    const piece = tempBoard[from];
    tempBoard[to] = piece;
    tempBoard[from] = null;
    
    const kingPos = this.findKing(piece.color, tempBoard);
    return !this.isSquareUnderAttack(kingPos, piece.color, tempBoard);
  }

  private findKing(color: string, board: Array<ChessPiece | null>): number {
    for(let i = 0; i < board.length; i++) {
        const piece = board[i];
        if (piece instanceof King && piece.color === color) {
            return i;
        }
    }
    throw new Error(`${color} king not found on board`);
  }

  private isSquareUnderAttack(square: number, color: string, board: Array<ChessPiece | null>): boolean {
    for(let i = 0; i < board.length; i++) {
        const piece = board[i];
        if (piece && piece.color !== color) {
            const tempBoard = new BoardState();
            tempBoard.board = [...board];
            
            const moves = piece.generate(tempBoard, i);
            if (moves.includes(square)) {
                return true;
            }
        }
    }
    return false;
  }

  private isCheckmate(color: string): boolean {
    if (!this.isInCheck(color)) {
        return false;
    }
    for (let i = 0; i < this.board.length; i++) {
        const piece = this.board[i];
        if (piece && piece.color === color) {
            const moves = piece.generate(this, i);
            for (const move of moves) {
                if (this.isValidMove(i, move)) {
                    return false;
                }
            }
        }
    }
    
    return true;
  }

  private isInCheck(color: string): boolean {
    const kingPosition = this.findKing(color, this.board);
    return this.isSquareUnderAttack(kingPosition, color, this.board);
  }

  makeMove(from: number, to: number): boolean {
    const piece = this.board[from];

    if (!piece) return false;
    if (piece.color !== this.turn) return false;

    const possibleMoves = piece.generate(this, from);
    if (!possibleMoves.includes(to)) return false;

    if (!this.isValidMove(from, to)) {
        console.log("Move would leave/put king in check!");
        return false;
    }

    const capturedPiece = this.board[to];
    if (piece instanceof Pawn) {
        const enPassantRow = piece.color === 'white' ? 3 : 4;
        if (Math.floor(from / 8) === enPassantRow) {
            const sideSquare = piece.color === 'white' ? to + 8 : to - 8;
            if (this.board[sideSquare] instanceof Pawn) {
                this.board[sideSquare] = null;
            }
        }
        piece.hasMoved = true;
        piece.justMadeTwoSquareMove = Math.abs(to - from) === 16;
    }

    this.board[to] = piece;
    this.board[from] = null;
    const opponentColor = this.turn === 'white' ? 'black' : 'white';
    if (this.isInCheck(opponentColor)) {
        console.log(`${opponentColor} is in check!`);
        if (this.isCheckmate(opponentColor)) {
            console.log(`Checkmate! ${this.turn} wins!`);
        }
    }

    this.switchTurn();
    return true;
  }
  switchTurn(): void {
    this.turn = this.turn === "white" ? "black" : "white"
  }

  checkCastlingPrivileges(turn: string) {
    if (turn === "white" && this.castlingPrivilegeWhite) {
      this.castlingPrivilegeWhite = false;
      return true;
    } else if (turn === "black" && this.castlingPrivilegeBlack) {
      this.castlingPrivilegeBlack = false;
      return true;
    }
    return false;
  }

  public getBoard() {
    return this.board;
  }

  gameloop(): void {
    while (true) {
      this.displayBoard();
      
      const move = prompt(`${this.turn}'s move: type in the form FromTo ie.. e2e4`);
      if (!move) continue;
      
      try {
        const from = algebraicToIndex(move.slice(0,2));
        const to = algebraicToIndex(move.slice(2,4));

        if(this.makeMove(from, to)) {
          console.log("Moved successfully!");
        } else {
          console.log("Invalid Move!");
        }
      } catch (error) {
        console.log("Invalid input format. Please use format 'e2e4'");
      }
    }
  }
  getAsciiCell(piece: ChessPiece | null): string[] {
    let symbol = " ";
    if (piece) {
      if (piece instanceof King) {
        symbol = piece.color === "white" ? "♔" : "♚";
      } else if (piece instanceof Queen) {
        symbol = piece.color === "white" ? "♕" : "♛";
      } else if (piece instanceof Rook) {
        symbol = piece.color === "white" ? "♖" : "♜";
      } else if (piece instanceof Bishop) {
        symbol = piece.color === "white" ? "♗" : "♝";
      } else if (piece instanceof Knight) {
        symbol = piece.color === "white" ? "♘" : "♞";
      } else if (piece instanceof Pawn) {
        symbol = piece.color === "white" ? "♙" : "♟";
      }
    }
    return [
      "┌─────┐",
      `│  ${symbol}  │`,
      "└─────┘"
    ];
  }


  private displayBoard(): void {
  const boardArt: string[] = [];
  const cellHeight = 3;
  let topLabels = "    ";
  for (let col = 0; col < 8; col++) {
    topLabels += "   " + String.fromCharCode(97 + col) + "    ";
  }
  boardArt.push(topLabels);
  for (let row = 0; row < 8; row++) {
    const rowLines: string[] = Array(cellHeight).fill("");
    const rankLabel = (8 - row).toString() + "  ";
    for (let col = 0; col < 8; col++) {
      const idx = row * 8 + col;
      const cellArt = this.getAsciiCell(this.board[idx]);
      for (let line = 0; line < cellHeight; line++) {
        if (col === 0) {
          rowLines[line] += line === Math.floor(cellHeight / 2) ? rankLabel : "   ";
        }
        rowLines[line] += cellArt[line] + " ";
      }
    }
    boardArt.push(...rowLines);
  }
  boardArt.push(topLabels);
  console.clear();
  console.log(boardArt.join("\n"));
}


  getPieceSymbol(piece: ChessPiece): string {
    if (piece.color === 'white') {
      return piece instanceof King ? '♔' :
             piece instanceof Queen ? '♕' :
             piece instanceof Rook ? '♖' :
             piece instanceof Bishop ? '♗' :
             piece instanceof Knight ? '♘' :
             piece instanceof Pawn ? '♙' : '.';
    } else {
      return piece instanceof King ? '♚' :
             piece instanceof Queen ? '♛' :
             piece instanceof Rook ? '♜' :
             piece instanceof Bishop ? '♝' :
             piece instanceof Knight ? '♞' :
             piece instanceof Pawn ? '♟' : '.';
    }
  }

  // Rendering attempt failed so I had to use gpt, this one below had too many overlapping column lines and looks horrible
  /*
    private displayBoard(): void {
    console.clear();
    console.log('\n     a    b    c    d    e    f    g    h');
    console.log('  ┌────┬────┬────┬────┬────┬────┬────┬────┐');
    for(let row = 0; row < 8; row ++) {
      let rowStr = `${8-row} │`;
      for (let col = 0; col < 8; col++) {
        const piece = this.board[row * 8 + col];
        // Use fixed-width symbols with proper padding
        const symbol = piece ? this.getPieceSymbol(piece) : '   ';
        rowStr += `${symbol}│`;
      }
      console.log(rowStr + ` ${8-row}`);
      if (row < 7) {
        console.log('  ├────┼────┼────┼────┼────┼────┼────┼────┤');
      }
    }
    console.log('  └────┴────┴────┴────┴────┴────┴────┴────┘');
    console.log('     a    b    c    d    e    f    g    h    \n');
  }

  private getPieceSymbol(piece: ChessPiece): string {
    // Use full-width symbols with proper spacing
    const symbols = {
      white: {
        King: '♔ ',
        Queen: '♕ ',
        Rook: '♖ ',
        Bishop: '♗ ',
        Knight: '♘ ',
        Pawn: '♙ '
      },
      black: {
        King: '♚ ',
        Queen: '♛ ',
        Rook: '♜ ',
        Bishop: '♝ ',
        Knight: '♞ ',
        Pawn: '♟ '
      }
    };

    const color = piece.color === 'white' ? 'white' : 'black';
    
    if (piece instanceof King) return symbols[color].King;
    if (piece instanceof Queen) return symbols[color].Queen;
    if (piece instanceof Rook) return symbols[color].Rook;
    if (piece instanceof Bishop) return symbols[color].Bishop;
    if (piece instanceof Knight) return symbols[color].Knight;
    if (piece instanceof Pawn) return symbols[color].Pawn;
    
    return '   ';
  } */
}

export {
  BoardState
}