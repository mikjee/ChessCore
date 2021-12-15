export declare enum EPieceColor {
    WHITE = "w",
    BLACK = "b"
}
export declare enum EPieceType {
    ROOK = "r",
    KNIGHT = "n",
    BISHOP = "b",
    KING = "k",
    QUEEN = "q",
    PAWN = "p"
}
export declare type TPiece = {
    color: EPieceColor;
    type: EPieceType;
};
export declare type TBoard = Array<Array<TPiece | null>>;
export declare type THeatMap = Array<Array<number>>;
export declare type TPosition = {
    row: number;
    col: number;
};
export declare type TSideStatus = {
    isCheck: boolean;
    enPassantArr: [boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean];
    hasKingMoved: boolean;
    hasLongRookMoved: boolean;
    hasShortRookMoved: boolean;
};
export declare type TStatus = {
    white: TSideStatus;
    black: TSideStatus;
    isCheckmate: boolean;
    isStalemate: boolean;
    currentTurn: EPieceColor;
};
export declare class ChessCore {
    private _board;
    private _status;
    get board(): TBoard;
    set board(val: TBoard);
    get status(): TStatus;
    set status(val: TStatus);
    private static comparePieces;
    private static checkBounds;
    private evaluateCheck;
    constructor(board?: TBoard, status?: TStatus);
    getMoves(position: TPosition, allowSpecialMoves?: boolean, preventCheck?: boolean): Array<TPosition>;
    getAllMoves(color: EPieceColor, allowSpecialMoves?: boolean, preventCheck?: boolean): Array<TPosition>;
    makeMove(startPosition: TPosition, endPosition: TPosition, enforceTurns?: boolean): TPiece | null | false;
    find(piece: TPiece, findAll?: boolean): Array<TPosition>;
    getPieceAt(position: TPosition): TPiece | null;
    pieceAt(row: number, col: number): TPiece | null;
    getWinner(): EPieceColor | false;
    static pieceToSymbol(piece: TPiece): string;
    static createPristineBoard(): TBoard;
    static createPristineStatus(): TStatus;
    static createBlankHeatMap(): THeatMap;
    static movesToHeatMap(movesArr: Array<TPosition>): THeatMap;
    static translatePosition(position: TPosition): string;
    private static calculateEloDelta;
    static calculateElo(self: number, opponent: number, selfGameResult: 0 | 1 | 0.5, kFactor?: number): number;
}
