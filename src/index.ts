import _ from 'lodash'

export enum EPieceColor {
	WHITE = 'w',
	BLACK = 'b'
}

export enum EPieceType {
	ROOK = 'r',
	KNIGHT = 'n',
	BISHOP = 'b',
	KING = 'k',
	QUEEN = 'q',
	PAWN = 'p',
}

export type TPiece = {
	color: EPieceColor,
	type: EPieceType
}

export type TBoard = Array<Array<TPiece | null>>
export type THeatMap = Array<Array<number>>

export type TPosition = {
	row: number,
	col: number
}

export type TSideStatus = {
	isCheck: boolean,
	enPassantArr: [boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean],
	hasKingMoved: boolean,
	hasLongRookMoved: boolean,
	hasShortRookMoved: boolean,
}

export type TStatus = {
	white: TSideStatus,
	black: TSideStatus,

	isCheckmate: boolean,
	isStalemate: boolean,
	currentTurn: EPieceColor,	
}

export class ChessCore {

	// Properties ------

	private _board: TBoard
	private _status: TStatus
	
	public get board() { return this._board }
	public set board(val: TBoard) { this._board = val }

	public get status() { return this._status }
	public set status(val: TStatus) { this._status = val }

	// Private Methods ------

	private static comparePieces(piece1: TPiece | null, piece2: TPiece | null): boolean {
		if (piece1 === null || piece2 === null) return false
		else if (piece1.type === piece2.type && piece1.color === piece2.color) return true
		else return false
	}

	private static checkBounds(position: TPosition): boolean {
		if (
			position.row < 0 || 
			position.row > 7 ||
			position.col < 0 ||
			position.col > 7
		) return false
		else return true
	}

	private evaluateCheck(color: EPieceColor) {
		const heatMap = ChessCore.movesToHeatMap(this.getAllMoves(color === EPieceColor.WHITE ? EPieceColor.BLACK : EPieceColor.WHITE, false, false))
		const kPos = this.find({ type: EPieceType.KING, color }, false)[0]
		
		if (heatMap[kPos.row][kPos.col] > 0) return true
		else return false
	}

	// Public Methods ------

	public constructor(board?: TBoard, status?: TStatus) {

		this._board = board ? _.cloneDeep(board) : ChessCore.createPristineBoard()
		this._status = status ? _.cloneDeep(status) : ChessCore.createPristineStatus()

	}

	public getMoves(position: TPosition, allowSpecialMoves: boolean = true, preventCheck: boolean = true): Array<TPosition> {

		let positionsArr: TPosition[] = []
		const piece = this.getPieceAt(position)

		if (!piece) return positionsArr

		const helper = (i: number, j: number) => ({row: i, col: j })

		const tryAddPosition = (newPosition: TPosition, allowCapture = true): boolean => {
			// Return value indicates if further traversal is possible (true if yes, false is obstacle is encountered - own or opponent piece)

			if (!ChessCore.checkBounds(newPosition)) return false
			const pieceThere = this.getPieceAt(newPosition)

			if (!pieceThere) {
				positionsArr.push(newPosition)
				return true
			}
			else if ((pieceThere.color !== piece.color) && allowCapture) {
				positionsArr.push(newPosition)
				return false
			}
			else return false
		}

		const tryAddStraights = () => {
			for (var i = position.row + 1; i < 8; i++) {
				if (!tryAddPosition(helper(i, position.col))) break
			}
			for (var i = position.row - 1; i >= 0; i--) {
				if (!tryAddPosition(helper(i, position.col))) break
			}
			for (var j = position.col + 1; j < 8; j++) {
				if (!tryAddPosition(helper(position.row, j))) break
			}
			for (var j = position.col - 1; j >= 0; j--) {
				if (!tryAddPosition(helper(position.row, j))) break
			}
		}

		const tryAddDiagonals = () => {
			const helper = (i: number, j: number) => ({row: i, col: j })

			for (var i = position.row + 1, j = position.col + 1; (i < 8) && (j < 8); i++, j++) {
				if (!tryAddPosition(helper(i, j))) break
			}
			for (var i = position.row - 1, j = position.col - 1; (i >= 0) && (j >= 0); i--, j--) {
				if (!tryAddPosition(helper(i, j))) break
			}
			for (var i = position.row + 1, j = position.col - 1; (i < 8) && (j >= 0); i++, j--) {
				if (!tryAddPosition(helper(i, j))) break
			}
			for (var i = position.row - 1, j = position.col + 1; (i >= 0) && (j < 8); i--, j++) {
				if (!tryAddPosition(helper(i, j))) break
			}
		}

		// Calculate moves

		if (piece.type === EPieceType.ROOK) {
			tryAddStraights()
		}

		else if (piece.type === EPieceType.KNIGHT) {
			tryAddPosition(helper(position.row + 1, position.col + 2))
			tryAddPosition(helper(position.row + 2, position.col + 1))
			tryAddPosition(helper(position.row - 1, position.col - 2))
			tryAddPosition(helper(position.row - 2, position.col - 1))
			tryAddPosition(helper(position.row + 1, position.col - 2))
			tryAddPosition(helper(position.row - 1, position.col + 2))
			tryAddPosition(helper(position.row + 2, position.col - 1))
			tryAddPosition(helper(position.row - 2, position.col + 1))
		}

		else if (piece.type === EPieceType.BISHOP) {
			tryAddDiagonals()
		}

		else if (piece.type === EPieceType.KING) {
			tryAddPosition(helper(position.row + 1, position.col + 1))
			tryAddPosition(helper(position.row + 1, position.col))
			tryAddPosition(helper(position.row - 1, position.col))
			tryAddPosition(helper(position.row, position.col + 1))
			tryAddPosition(helper(position.row, position.col - 1))
			tryAddPosition(helper(position.row - 1, position.col - 1))
			tryAddPosition(helper(position.row + 1, position.col - 1))
			tryAddPosition(helper(position.row - 1, position.col + 1))

			// Castle
			if (allowSpecialMoves) {
				if (piece.color === EPieceColor.WHITE) {
					if (!this.status.white.hasKingMoved && !this.status.white.isCheck) {
						const BHeatMap = ChessCore.movesToHeatMap(this.getAllMoves(EPieceColor.BLACK, false, false))

						if (!this.status.white.hasShortRookMoved) {
							if (!this.pieceAt(0, 5) && !this.pieceAt(0, 6)) {
								if (!BHeatMap[0][5] && !BHeatMap[0][6]) tryAddPosition(helper(0, 6), false)
							}
						}
						if (!this.status.white.hasLongRookMoved) {
							if (!this.pieceAt(0, 1) && !this.pieceAt(0, 2) && !this.pieceAt(0, 3)) {
								if (!BHeatMap[0][1] && !BHeatMap[0][2] && !BHeatMap[0][3]) tryAddPosition(helper(0, 2), false)
							}
						}
					}
				}

				else {
					if (!this.status.black.hasKingMoved && !this.status.black.isCheck) {
						const WHeatMap = ChessCore.movesToHeatMap(this.getAllMoves(EPieceColor.WHITE, false, false))

						if (!this.status.black.hasShortRookMoved) {
							if (!this.pieceAt(7, 5) && !this.pieceAt(7, 6)) {
								if (!WHeatMap[7][5] && !WHeatMap[7][6]) tryAddPosition(helper(7, 6), false)
							}
						}
						if (!this.status.black.hasLongRookMoved) {
							if (!this.pieceAt(7, 1) && !this.pieceAt(7, 2) && !this.pieceAt(7, 3)) {
								if (!WHeatMap[7][1] && !WHeatMap[7][2] && !WHeatMap[7][3]) tryAddPosition(helper(7, 2), false)
							}
						}
					}
				}
			}
			
		}

		else if (piece.type === EPieceType.QUEEN) {
			tryAddStraights()
			tryAddDiagonals()
		}

		else if (piece.type === EPieceType.PAWN) {

			if (piece.color === EPieceColor.WHITE) {

				tryAddPosition(helper(position.row + 1, position.col), false)
				if (position.row === 1) tryAddPosition(helper(position.row + 2, position.col), false)
				
				let pieceThere = this.pieceAt(position.row + 1, position.col + 1)
				if (pieceThere && pieceThere.color === EPieceColor.BLACK) tryAddPosition(helper(position.row + 1, position.col + 1))

				pieceThere = this.pieceAt(position.row + 1, position.col - 1)
				if (pieceThere && pieceThere.color === EPieceColor.BLACK) tryAddPosition(helper(position.row + 1, position.col - 1))

				// En passant
				if (allowSpecialMoves && position.row === 4) {
					pieceThere = this.pieceAt(position.row, position.col + 1)	
					if (
						pieceThere && 
						pieceThere.color === EPieceColor.BLACK && 
						pieceThere.type === EPieceType.PAWN && 
						this.status.black.enPassantArr[position.col + 1]
					) tryAddPosition(helper(position.row + 1, position.col + 1))	

					pieceThere = this.pieceAt(position.row, position.col - 1)
					if (
						pieceThere && 
						pieceThere.color === EPieceColor.BLACK && 
						pieceThere.type === EPieceType.PAWN && 
						this.status.black.enPassantArr[position.col - 1]
					) tryAddPosition(helper(position.row + 1, position.col - 1))					
				}
				
			}

			else {

				tryAddPosition(helper(position.row - 1, position.col), false)
				if (position.row === 6) tryAddPosition(helper(position.row - 2, position.col), false)

				let pieceThere = this.pieceAt(position.row - 1, position.col + 1)
				if (pieceThere && pieceThere.color === EPieceColor.WHITE) tryAddPosition(helper(position.row - 1, position.col + 1))

				pieceThere = this.pieceAt(position.row - 1, position.col - 1)
				if (pieceThere && pieceThere.color === EPieceColor.WHITE) tryAddPosition(helper(position.row - 1, position.col - 1))

				// En passant
				if (allowSpecialMoves && position.row === 3) {
					pieceThere = this.pieceAt(position.row, position.col + 1)
					if (
						pieceThere &&
						pieceThere.color === EPieceColor.WHITE &&
						pieceThere.type === EPieceType.PAWN && 
						this.status.white.enPassantArr[position.col + 1]
					) tryAddPosition(helper(position.row - 1, position.col + 1))

					pieceThere = this.pieceAt(position.row, position.col - 1)
					if (
						pieceThere &&
						pieceThere.color === EPieceColor.WHITE &&
						pieceThere.type === EPieceType.PAWN && 
						this.status.white.enPassantArr[position.col - 1]
					) tryAddPosition(helper(position.row - 1, position.col - 1))
				}

			}

		}

		// Filter moves that create or continue own check

		if (preventCheck) {
			const tryResolveCheck = (startPosition: TPosition, endPosition: TPosition) => {
				const p1 = this.getPieceAt(startPosition)!, p2 = this.getPieceAt(endPosition)

				this._board[endPosition.row][endPosition.col] = p1
				this._board[startPosition.row][startPosition.col] = null
				
				let isResolved = false
				if (!this.evaluateCheck(p1.color)) isResolved = true

				this._board[endPosition.row][endPosition.col] = p2
				this._board[startPosition.row][startPosition.col] = p1

				return isResolved
			}
			positionsArr = positionsArr.filter(endPosition => tryResolveCheck(position, endPosition))
		}

		// All done

		return positionsArr

	}

	public getAllMoves(color: EPieceColor, allowSpecialMoves: boolean = true, preventCheck: boolean = true): Array<TPosition> {
		let positionsArr: TPosition[] = []

		for(var i = 0; i < 8; i++) {
			for (var j = 0; j < 8; j++) {
				const piece = this.pieceAt(i, j)
				if (piece && piece.color === color) {
					positionsArr.push(...this.getMoves({row: i, col: j}, allowSpecialMoves, preventCheck))
				}
			}
		}

		return positionsArr
	}

	public makeMove(startPosition: TPosition, endPosition: TPosition, enforceTurns: boolean = true): TPiece | null | false {
		
		// 1. Check if we got a piece
		// 2. Check if it's a valid move
		// 3. Execute the move
		// 4. Update status	

		// Step 1	
		const piece = this.getPieceAt(startPosition)
		let capturedPiece = this.getPieceAt(endPosition)
		if (!piece) return false 

		// Helpers
		const oppColor = piece.color === EPieceColor.WHITE ? EPieceColor.BLACK : EPieceColor.WHITE
		const oppColorStr = piece.color === EPieceColor.WHITE ? 'black' : 'white'
		const sameColorStr = piece.color === EPieceColor.WHITE ? 'white' : 'black'

		// Step 2
		if (enforceTurns && this._status.currentTurn !== piece.color) return false
		const moves = this.getMoves(startPosition, true)
		const movesHeatMap = ChessCore.movesToHeatMap(moves)
		if (!movesHeatMap[endPosition.row][endPosition.col]) return false 

		// Step 3
		this._board[endPosition.row][endPosition.col] = piece 
		this._board[startPosition.row][startPosition.col] = null	

		// Sub-step 4 - Determine castle status, optionally perform castle
		if (piece.type === EPieceType.KING) {
			if (!this._status[sameColorStr].hasKingMoved) {
				if (endPosition.col === 2) {
					this._board[piece.color === EPieceColor.WHITE ? 0 : 7][3] = { type: EPieceType.ROOK, color: piece.color }
					this._board[piece.color === EPieceColor.WHITE ? 0 : 7][0] = null
					this._status[sameColorStr].hasShortRookMoved = true
				}
				else if (endPosition.col === 6) {
					this._board[piece.color === EPieceColor.WHITE ? 0 : 7][5] = { type: EPieceType.ROOK, color: piece.color }
					this._board[piece.color === EPieceColor.WHITE ? 0 : 7][7] = null
					this._status[sameColorStr].hasLongRookMoved = true
				}
			}
			this._status[sameColorStr].hasKingMoved = true
		}
		else if (piece.type === EPieceType.ROOK) {
			if (startPosition.col === 0) this._status[sameColorStr].hasLongRookMoved = true
			else if (startPosition.col === 7) this._status[sameColorStr].hasShortRookMoved = true
		}

		// Sub-step 4 - Update opponent's castle status if their rook dies
		if (capturedPiece && capturedPiece.type === EPieceType.ROOK) {
			if (!this._status[oppColorStr].hasShortRookMoved && endPosition.col === 7) {
				if ((oppColor === EPieceColor.BLACK && endPosition.row === 7) || 
					(oppColor === EPieceColor.WHITE && endPosition.row === 0)) this._status[oppColorStr].hasShortRookMoved = true
			}
			else if (!this._status[oppColorStr].hasLongRookMoved && endPosition.col === 0) {
				if ((oppColor === EPieceColor.BLACK && endPosition.row === 7) || 
					(oppColor === EPieceColor.WHITE && endPosition.row === 0)) this._status[oppColorStr].hasLongRookMoved = true
			}
		}

		// Sub-step 4 - En Passant and promotion
		if (piece.type === EPieceType.PAWN) {

			// Update own En passant status
			if (piece.color === EPieceColor.WHITE) {
				if (startPosition.row === 1 && endPosition.row === 3) this._status[sameColorStr].enPassantArr[startPosition.col] = true
				else this._status[sameColorStr].enPassantArr[startPosition.col] = false
			}
			else {
				if (startPosition.row === 6 && endPosition.row === 4) this._status[sameColorStr].enPassantArr[startPosition.col] = true
				else this._status[sameColorStr].enPassantArr[startPosition.col] = false
			}

			// Perform en passant
			if (piece.color === EPieceColor.WHITE) {
				if (startPosition.row === 4 && 
					endPosition.row === 5 &&
					!capturedPiece &&
					this._status[oppColorStr].enPassantArr[endPosition.col] &&
					(endPosition.col === startPosition.col - 1 || 
					endPosition.col === startPosition.col + 1)) {

					const targetPiece = this.pieceAt(4, endPosition.col)
					if (targetPiece && 
						targetPiece.type === EPieceType.PAWN && 
						targetPiece.color === oppColor) {
							capturedPiece = targetPiece
							this._board[4][endPosition.col] = null
						}
				} 	
			}
			else {
				if (startPosition.row === 3 && 
					endPosition.row === 2 &&
					!capturedPiece &&
					this._status[oppColorStr].enPassantArr[endPosition.col] &&
					(endPosition.col === startPosition.col - 1 || 
					endPosition.col === startPosition.col + 1)) {

					const targetPiece = this.pieceAt(3, endPosition.col)
					if (targetPiece && 
						targetPiece.type === EPieceType.PAWN && 
						targetPiece.color === oppColor) {
							capturedPiece = targetPiece
							this._board[3][endPosition.col] = null
						}
				} 	
			}

			// Perform Promotion
			if (piece.color === EPieceColor.WHITE && endPosition.row === 7) {
				this._board[endPosition.row][endPosition.col] = { type: EPieceType.QUEEN, color: piece.color}
			}
			else if (piece.color === EPieceColor.BLACK && endPosition.row === 0) {
				this._board[endPosition.row][endPosition.col] = { type: EPieceType.QUEEN, color: piece.color}
			}

		}

		// Sub-step 4 - Reset Opp en passant
		this._status[oppColorStr].enPassantArr = [false, false, false, false, false, false, false, false]

		// Sub-step 4 - Determine check status - opponent
		if (this.getAllMoves(oppColor, true).length === 0) {
			if (this.evaluateCheck(oppColor)) {
				this._status[oppColorStr].isCheck = true
				this._status.isCheckmate = true
			}
			else this._status.isStalemate = true
		}
		else if (this.evaluateCheck(oppColor)) {
			this._status[oppColorStr].isCheck = true
		}

		// Sub-step 4 - reset check own status
		this._status[piece.color === EPieceColor.WHITE ? 'white' : 'black'].isCheck = false

		// Sub-step 4 - Update turn
		this._status.currentTurn = oppColor

		// All done
		return capturedPiece

	}

	public find(piece: TPiece, findAll: boolean = false): Array<TPosition> {
		let positionsArr: TPosition[] = []

		for (var i = 0; i < 8; i++) {
			for (var j = 0; j < 8; j++) {
				if (ChessCore.comparePieces(this._board[i][j], piece)) {
					positionsArr.push({row: i, col: j})
					if (!findAll) return positionsArr
				}
			}
		}

		return positionsArr
	}

	public getPieceAt(position: TPosition): TPiece | null {
		return this._board[position.row][position.col]
	}

	public pieceAt(row: number, col: number): TPiece | null {
		return this.getPieceAt({row, col})
	}

	public getWinner(): EPieceColor | false {
		if (!this._status.isCheckmate) return false
		if (this._status.black.isCheck) return EPieceColor.WHITE
		else return EPieceColor.BLACK
	}

	// Static Methods ------

	public static pieceToSymbol(piece: TPiece): string {
		if (piece.type === EPieceType.ROOK && piece.color === EPieceColor.WHITE) return 'r'
		else if (piece.type === EPieceType.KNIGHT && piece.color === EPieceColor.WHITE) return 'h'
		else if (piece.type === EPieceType.BISHOP && piece.color === EPieceColor.WHITE) return 'b'
		else if (piece.type === EPieceType.KING && piece.color === EPieceColor.WHITE) return 'k'
		else if (piece.type === EPieceType.QUEEN && piece.color === EPieceColor.WHITE) return 'q'
		else if (piece.type === EPieceType.PAWN && piece.color === EPieceColor.WHITE) return 'p'

		else if (piece.type === EPieceType.ROOK && piece.color === EPieceColor.BLACK) return 't'
		else if (piece.type === EPieceType.KNIGHT && piece.color === EPieceColor.BLACK) return 'j'
		else if (piece.type === EPieceType.BISHOP && piece.color === EPieceColor.BLACK) return 'n'
		else if (piece.type === EPieceType.KING && piece.color === EPieceColor.BLACK) return 'l'
		else if (piece.type === EPieceType.QUEEN && piece.color === EPieceColor.BLACK) return 'w'
		else if (piece.type === EPieceType.PAWN && piece.color === EPieceColor.BLACK) return 'o'
		
		return ''
	}

	public static createPristineBoard(): TBoard {

		const mainLine = [
			EPieceType.ROOK,
			EPieceType.KNIGHT,
			EPieceType.BISHOP,	
			EPieceType.QUEEN,
			EPieceType.KING,
			EPieceType.BISHOP,
			EPieceType.KNIGHT,
			EPieceType.ROOK
		]

		const pawnLine = [
			EPieceType.PAWN,
			EPieceType.PAWN,
			EPieceType.PAWN,
			EPieceType.PAWN,
			EPieceType.PAWN,
			EPieceType.PAWN,
			EPieceType.PAWN,
			EPieceType.PAWN
		]

		const addColor = (pieceLine: Array<EPieceType>, color: EPieceColor) => {
			return pieceLine.map(type => ({ type, color }))
		}

		return ([
			addColor(mainLine, EPieceColor.WHITE),
			addColor(pawnLine, EPieceColor.WHITE),
			[null, null, null, null, null, null, null, null],
			[null, null, null, null, null, null, null, null],
			[null, null, null, null, null, null, null, null],
			[null, null, null, null, null, null, null, null],
			addColor(pawnLine, EPieceColor.BLACK),
			addColor(mainLine, EPieceColor.BLACK),
		])
	}

	public static createPristineStatus(): TStatus {
		return ({

			white: {
				isCheck: false,
				enPassantArr: [false, false, false, false, false, false, false, false],
				hasKingMoved: false,
				hasLongRookMoved: false,
				hasShortRookMoved: false,
			},

			black: {
				isCheck: false,
				enPassantArr: [false, false, false, false, false, false, false, false],
				hasKingMoved: false,
				hasLongRookMoved: false,
				hasShortRookMoved: false,
			},

			isCheckmate: false,
			isStalemate: false,
			currentTurn: EPieceColor.WHITE,
		})
	}

	public static createBlankHeatMap(): THeatMap {
		return [
			[0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0, 0],
		]
	}

	public static movesToHeatMap(movesArr: Array<TPosition>): THeatMap {
		let heatMap = ChessCore.createBlankHeatMap()
		movesArr.forEach(position => heatMap[position.row][position.col]++)
		return heatMap
	}

	public static translatePosition(position: TPosition): string {
		return String.fromCharCode(position.col + 97) + (position.row + 1).toString()
	}

	private static calculateEloDelta(
		self: number, 
		opponent: number, 
		selfGameResult: 0 | 1 | 0.5, 
		kFactor: number = 32
	) {
		var myChanceToWin = 1 / ( 1 + Math.pow(10, (opponent - self) / 400))
		return Math.round(kFactor * (selfGameResult - myChanceToWin))
	}

  	public static calculateElo(
		self: number, 
		opponent: number, 
		selfGameResult: 0 | 1 | 0.5, 
		kFactor: number = 32
	) {
		return self + ChessCore.calculateEloDelta(self, opponent, selfGameResult, kFactor)
  	}

}