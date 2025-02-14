export abstract class ChessPiece {
  public color: 'white' | 'black';
  public type: 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';

  constructor(color: 'white' | 'black', type: 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king') {
    this.color = color;
    this.type = type;
  }

  abstract generate(board: BoardState, index: number): number[];

  // Generate moves without check validation
  generateRawMoves(board: BoardState, index: number): number[] {
    return this.generate(board, index);
  }
}

interface generateMoves {
  generate(board: BoardState, index: number): number[];
}

export class Pawn extends ChessPiece implements generateMoves {
  constructor(color: 'white' | 'black') {
    super(color, 'pawn');
  }

  private getForwardMoves(board: BoardState, index: number, pawnState: { hasMoved: boolean }): number[] {
    const moves: number[] = [];
    const direction = this.color === 'white' ? -8 : 8;
    const forwardOne = index + direction;
    
    if (board.getBoard()[forwardOne] === null) {
      moves.push(forwardOne);
      // Two-step move from starting position
      const forwardTwo = forwardOne + direction;
      if (!pawnState.hasMoved && board.getBoard()[forwardTwo] === null) {
        moves.push(forwardTwo);
      }
    }
    return moves;
  }

  private getCaptureSquares(board: BoardState, index: number): number[] {
    const moves: number[] = [];
    const currentCol = index % 8;
    const direction = this.color === 'white' ? -8 : 8;
    const enemyColor = this.color === 'white' ? 'black' : 'white';

    // Left capture
    if (currentCol > 0) {
      const leftTarget = index + direction - 1;
      const piece = board.getBoard()[leftTarget];
      if (piece?.color === enemyColor) {
        moves.push(leftTarget);
      }
    }

    // Right capture
    if (currentCol < 7) {
      const rightTarget = index + direction + 1;
      const piece = board.getBoard()[rightTarget];
      if (piece?.color === enemyColor) {
        moves.push(rightTarget);
      }
    }

    return moves;
  }

  private getEnPassantMoves(board: BoardState, index: number): number[] {
    const moves: number[] = [];
    const currentCol = index % 8;
    const currentRow = Math.floor(index / 8);
    const enemyColor = this.color === 'white' ? 'black' : 'white';
    const validRow = this.color === 'white' ? 3 : 4;
    const direction = this.color === 'white' ? -8 : 8;

    if (currentRow === validRow) {
      // Check left
      if (currentCol > 0) {
        const leftPawn = board.getBoard()[index - 1];
        if (leftPawn instanceof Pawn && 
            leftPawn.color === enemyColor && 
            board.pawnStates.get(index - 1)?.twoStep) {
          moves.push(index + direction - 1);
        }
      }
      // Check right
      if (currentCol < 7) {
        const rightPawn = board.getBoard()[index + 1];
        if (rightPawn instanceof Pawn && 
            rightPawn.color === enemyColor && 
            board.pawnStates.get(index + 1)?.twoStep) {
          moves.push(index + direction + 1);
        }
      }
    }
    return moves;
  }

  generate(board: BoardState, index: number): number[] {
    const pawnState = board.pawnStates.get(index) || { hasMoved: false, twoStep: false };
    return [
      ...this.getForwardMoves(board, index, pawnState),
      ...this.getCaptureSquares(board, index),
      ...this.getEnPassantMoves(board, index)
    ];
  }
}

export class Knight extends ChessPiece implements generateMoves {
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

export class Bishop extends ChessPiece implements generateMoves {
  constructor(color: 'white' | 'black') {
    super(color, 'bishop')
  }

  generate(board: BoardState, index: number): number[] {
    const moves: number[] = [];
    const currentCol = index % 8;
    const currentRow = Math.floor(index / 8);

    const directions = [
      [1, 1],    // down-right
      [1, -1],   // down-left
      [-1, 1],   // up-right
      [-1, -1]   // up-left
    ];

    for (const [dx, dy] of directions) {
      let newRow = currentRow;
      let newCol = currentCol;

      while (true) {
        newRow += dx;
        newCol += dy;

        // Check boundaries
        if (newRow < 0 || newRow > 7 || newCol < 0 || newCol > 7) break;

        const newIndex = newRow * 8 + newCol;
        const targetPiece = board.getBoard()[newIndex];

        if (targetPiece) {
          // Can capture opponent's piece but can't go further
          if (targetPiece.color !== this.color) {
            moves.push(newIndex);
          }
          break;  // Stop in this direction after hitting any piece
        }

        moves.push(newIndex);  // Empty square, can move here
      }
    }

    return moves;
  }
}

export class Rook extends ChessPiece implements generateMoves {
  constructor(color: 'white' | 'black') {
    super(color, 'rook')
  }

  generate(board: BoardState, index: number): number[] {
    const moves: number[] = [];
    const currentCol = index % 8;
    const currentRow = Math.floor(index / 8);

    const directions = [
      [0, 1],   // right
      [0, -1],  // left
      [1, 0],   // down
      [-1, 0]   // up
    ];

    for (const [dx, dy] of directions) {
      let newRow = currentRow;
      let newCol = currentCol;

      while (true) {
        newRow += dx;
        newCol += dy;

        // Check boundaries
        if (newRow < 0 || newRow > 7 || newCol < 0 || newCol > 7) break;

        const newIndex = newRow * 8 + newCol;
        const targetPiece = board.getBoard()[newIndex];

        if (targetPiece) {
          // Can capture opponent's piece but can't go further
          if (targetPiece.color !== this.color) {
            moves.push(newIndex);
          }
          break;  // Stop in this direction after hitting any piece
        }

        moves.push(newIndex);  // Empty square, can move here
      }
    }

    return moves;
  }
}

export class Queen extends ChessPiece implements generateMoves {
  constructor(color: 'white' | 'black') {
    super(color, 'queen')
  }

  generate(board: BoardState, index: number): number[] {
    const moves: number[] = [];
    const currentCol = index % 8;
    const currentRow = Math.floor(index / 8);

    // Horizontal and vertical moves (rook-like)
    const straightDirections = [
      [0, 1],   // right
      [0, -1],  // left
      [1, 0],   // down
      [-1, 0]   // up
    ];

    // Diagonal moves (bishop-like)
    const diagonalDirections = [
      [1, 1],    // down-right
      [1, -1],   // down-left
      [-1, 1],   // up-right
      [-1, -1]   // up-left
    ];

    const directions = [...straightDirections, ...diagonalDirections];

    for (const [dx, dy] of directions) {
      let newRow = currentRow;
      let newCol = currentCol;

      while (true) {
        newRow += dx;
        newCol += dy;

        // Check boundaries
        if (newRow < 0 || newRow > 7 || newCol < 0 || newCol > 7) break;

        const newIndex = newRow * 8 + newCol;
        const targetPiece = board.getBoard()[newIndex];

        if (targetPiece) {
          // Can capture opponent's piece but can't go further
          if (targetPiece.color !== this.color) {
            moves.push(newIndex);
          }
          break;  // Stop in this direction after hitting any piece
        }

        moves.push(newIndex);  // Empty square, can move here
      }
    }

    return moves;
  }
}

export class King extends ChessPiece implements generateMoves {
  constructor(color: 'white' | 'black') {
    super(color, 'king')
  }

  generate(board: BoardState, index: number): number[] {
    const moves: number[] = [];
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],          [0, 1],
      [1, -1],  [1, 0], [1, 1]
    ];

    const currentCol = index % 8;
    const currentRow = Math.floor(index / 8);

    for (const [dx, dy] of directions) {
      const col = currentCol + dx;
      const row = currentRow + dy;
      if (col >= 0 && col < 8 && row >= 0 && row < 8) {
        const target = row * 8 + col;
        const piece = board.getBoard()[target];
        if (!piece || piece.color !== this.color) {
          moves.push(target);
        }
      }
    }

    // Add castling logic here
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

// Add type for move input
interface MoveInput {
  from: number;
  to: number;
}

// Temporary implementation for testing
async function getMoveInput(): Promise<MoveInput> {
  return {
    from: algebraicToIndex('e2'),
    to: algebraicToIndex('e4')
  };
}

class BoardState {
  private constructor(
    public readonly board: Array<ChessPiece | null>,
    public readonly turn: 'white' | 'black',
    public readonly castlingPrivilegeWhite: boolean,
    public readonly castlingPrivilegeBlack: boolean,
    public readonly pawnStates: Map<number, { hasMoved: boolean, twoStep: boolean }>
  ) {}

  public static createNew(): BoardState {
    const board = new Array<ChessPiece | null>(64).fill(null);
    
    // Black pieces
    board[0] = new Rook('black');
    board[1] = new Knight('black');
    board[2] = new Bishop('black');
    board[3] = new Queen('black');
    board[4] = new King('black');
    board[5] = new Bishop('black');
    board[6] = new Knight('black');
    board[7] = new Rook('black');
    
    // Black pawns
    for (let i = 8; i < 16; i++) {
      board[i] = new Pawn('black');
    }

    // White pieces
    board[56] = new Rook('white');
    board[57] = new Knight('white');
    board[58] = new Bishop('white');
    board[59] = new Queen('white');
    board[60] = new King('white');
    board[61] = new Bishop('white');
    board[62] = new Knight('white');
    board[63] = new Rook('white');
    
    // White pawns
    for (let i = 48; i < 56; i++) {
      board[i] = new Pawn('white');
    }

    return new BoardState(
      board,
      'white',
      true,
      true,
      new Map()
    );
  }

  // MakeMove function to change board State
  // isValidMove to check if valid move
  // switchTurn

   isValidMove(from: number, to: number): boolean {
    // 1. Basic position validation
    if (from < 0 || from > 63 || to < 0 || to > 63) return false;
    if (from === to) return false;  // Cannot move to same square

    // 2. Piece validation
    const piece = this.board[from];
    if (!piece) return false;  // No piece at from position
    if (piece.color !== this.turn) return false;  // Wrong color's turn
    
    // 3. Target square validation
    const targetPiece = this.board[to];
    if (targetPiece?.color === piece.color) return false;  // Cannot capture own piece

    // 4. Get valid moves and verify
    const validMoves = piece.generate(this, from);
    if (!validMoves.includes(to)) return false;

    // 5. Check validation
    const tempBoard = [...this.board];
    tempBoard[to] = piece;
    tempBoard[from] = null;
    
    const kingPos = piece.type === 'king' ? 
      to : this.findKing(piece.color, tempBoard);
      
    // Create temporary board state for check validation
    const tempState = new BoardState(
      tempBoard,
      this.turn,
      this.castlingPrivilegeWhite,
      this.castlingPrivilegeBlack,
      new Map(this.pawnStates)
    );

    return !this.wouldBeInCheck(kingPos, piece.color, tempState);
  }

  private wouldBeInCheck(kingPos: number, color: string, state: BoardState): boolean {
    // Check all opponent pieces
    for (let i = 0; i < 64; i++) {
      const piece = state.board[i];
      if (piece && piece.color !== color) {
        // Generate raw moves without check validation to avoid recursion
        const moves = piece.generateRawMoves(state, i);
        if (moves.includes(kingPos)) return true;
      }
    }
    return false;
  }

  public findKing(color: string, board: Array<ChessPiece | null>): number {
    for(let i = 0; i < board.length; i++) {
        const piece = board[i];
        if (piece instanceof King && piece.color === color) {
            return i;
        }
    }
    throw new Error(`${color} king not found on board`);
  }

  public isSquareUnderAttack(square: number, defendingColor: string): boolean {
    for (let i = 0; i < this.board.length; i++) {
      const piece = this.board[i];
      if (piece && piece.color !== defendingColor) {
        // Don't create new board state to avoid infinite recursion
        const moves = piece.generate(this, i);
        if (moves.includes(square)) {
          return true;
        }
      }
    }
    return false;
  }

  public isCheckmate(color: string): boolean {
    // First verify the king is in check
    if (!this.isInCheck(color)) {
      return false;
    }

    // Check if any piece can make a legal move
    for (let i = 0; i < 64; i++) {
      const piece = this.board[i];
      if (piece && piece.color === color) {
        // Get all possible moves for this piece
        const moves = piece.generate(this, i);
        
        // Try each move to see if it gets out of check
        for (const move of moves) {
          if (this.isValidMove(i, move)) {
            return false; // Found a legal move, not checkmate
          }
        }
      }
    }
    
    // No legal moves found while in check = checkmate
    return true;
  }

  public isInCheck(color: string): boolean {
    const kingPos = this.findKing(color, this.board);
    return this.isSquareUnderAttack(kingPos, color);
  }

  private isEnPassantCapture(piece: ChessPiece, from: number, to: number): boolean {
    if (!(piece instanceof Pawn)) return false;
    const fromCol = from % 8;
    const toCol = to % 8;
    return fromCol !== toCol && this.board[to] === null;
  }

  private updatePawnState(newPawnStates: Map<number, any>, to: number, distance: number): void {
    // Set state for moved pawn
    newPawnStates.set(to, {
      hasMoved: true,
      twoStep: distance === 16
    });

    // Reset twoStep for all other pawns
    newPawnStates.forEach((state, index) => {
      if (index !== to) {
        newPawnStates.set(index, { ...state, twoStep: false });
      }
    });
  }

  private isPawnPromotion(piece: ChessPiece, to: number): boolean {
    if (!(piece instanceof Pawn)) return false;
    const toRow = Math.floor(to / 8);
    return (piece.color === 'white' && toRow === 0) || 
           (piece.color === 'black' && toRow === 7);
  }

  public makeMove(from: number, to: number): BoardState | null {
    if (!this.isValidMove(from, to)) return null;

    const piece = this.board[from];
    if (!piece) return null;

    const newBoard = [...this.board];
    const newPawnStates = new Map(this.pawnStates);
    const distance = Math.abs(to - from);

    // Handle pawn special cases
    if (piece instanceof Pawn) {
      if (this.isEnPassantCapture(piece, from, to)) {
        const capturedPawnIndex = piece.color === 'white' ? to + 8 : to - 8;
        newBoard[capturedPawnIndex] = null;
      }
      
      // Handle pawn promotion
      if (this.isPawnPromotion(piece, to)) {
        newBoard[to] = new Queen(piece.color);
      } else {
        newBoard[to] = piece;
      }
      
      this.updatePawnState(newPawnStates, to, distance);
    } else {
      newBoard[to] = piece;
    }

    newBoard[from] = null;

    const newState = new BoardState(
      newBoard,
      this.turn === 'white' ? 'black' : 'white',
      this.castlingPrivilegeWhite,
      this.castlingPrivilegeBlack,
      newPawnStates
    );

    // Check for checkmate after move
    const oppositeColor = this.turn === 'white' ? 'black' : 'white';
    if (newState.isCheckmate(oppositeColor)) {
      console.log(`Checkmate! ${this.turn} wins!`);
    } else if (newState.isStalemate(oppositeColor)) {
      console.log('Stalemate! Game is a draw.');
    } else if (newState.isInCheck(oppositeColor)) {
      console.log(`${oppositeColor} is in check!`);
    }

    return newState;
  }

  switchTurn(): BoardState {
    return new BoardState(
      this.board,
      this.turn === "white" ? "black" : "white",
      this.castlingPrivilegeWhite,
      this.castlingPrivilegeBlack,
      this.pawnStates
    );
  }

  checkCastlingPrivileges(turn: 'white' | 'black'): BoardState {
    if (turn === "white") {
      return new BoardState(
        this.board,
        this.turn,
        false,
        this.castlingPrivilegeBlack,
        this.pawnStates
      );
    }
    return new BoardState(
      this.board,
      this.turn,
      this.castlingPrivilegeWhite,
      false,
      this.pawnStates
    );
  }

  public getBoard() {
    return this.board;
  }

  // Pure function for move processing
  static processMove(currentState: BoardState, from: number, to: number): BoardState | null {
    return currentState.makeMove(from, to);
  }

  // Separate I/O handling
  static async gameLoop(initialState: BoardState) {
    let state = initialState;
    while (true) {
      state.displayBoard();
      const move = await getMoveInput();
      const newState = BoardState.processMove(state, move.from, move.to);
      state = newState || state;
    }
  }

  public displayBoard(): void {
    console.log('\n    a   b   c   d   e   f   g   h');
    console.log('  ┌───┬───┬───┬───┬───┬───┬───┬───┐');
    
    for(let row = 0; row < 8; row++) {
      let rowStr = `${8 - row} │`;
      for (let col = 0; col < 8; col++) {
        const piece = this.board[row * 8 + col];
        const symbol = piece ? this.getPieceSymbol(piece) : ' ';
        rowStr += ` ${symbol} │`;
      }
      console.log(rowStr + ` ${8 - row}`);
      if (row < 7) console.log('  ├───┼───┼───┼───┼───┼───┼───┼───┤');
    }
    
    console.log('  └───┴───┴───┴───┴───┴───┴───┴───┘');
    console.log('    a   b   c   d   e   f   g   h\n');
  }

  private getPieceSymbol(piece: ChessPiece): string {
    const symbols = {
      white: {
        king: '♔',
        queen: '♕',
        rook: '♖',
        bishop: '♗',
        knight: '♘',
        pawn: '♙'
      },
      black: {
        king: '♚',
        queen: '♛',
        rook: '♜',
        bishop: '♝',
        knight: '♞',
        pawn: '♟'
      }
    };
    
    return symbols[piece.color][piece.type];
  }

  static createNewState(
    board: Array<ChessPiece | null>,
    turn: 'white' | 'black',
    castlingWhite: boolean,
    castlingBlack: boolean,
    pawnStates: Map<number, { hasMoved: boolean, twoStep: boolean }>
  ) {
    return new BoardState(board, turn, castlingWhite, castlingBlack, pawnStates);
  }

  public isStalemate(color: string): boolean {
    // First verify the king is NOT in check
    if (this.isInCheck(color)) {
      return false;
    }

    // Check if any piece can make a legal move
    for (let i = 0; i < 64; i++) {
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
}

export {
  BoardState
}

export const updatePawnState = (
  state: BoardState,
  index: number,
  update: Partial<{ hasMoved: boolean, twoStep: boolean }>
) => {
  const newStates = new Map(state.pawnStates);
  newStates.set(index, { 
    ...(state.pawnStates.get(index) || { hasMoved: false, twoStep: false }),
    ...update
  });
  
  return BoardState.createNewState(
    state.board,
    state.turn,
    state.castlingPrivilegeWhite,
    state.castlingPrivilegeBlack,
    newStates
  );
};