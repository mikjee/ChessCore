# ChessCore

Chess validation and move-generation engine in Javascript.

## Installation

```sh
npm i -S chesscorejs
```

## Creating a new game

To create a pristine new game of chess - 

```js
import { ChessCore } from 'chesscorejs'
const game = new ChessCore()
game.makeMove(startPosition, endPosition, true)
```

The created 'game' object will give you access to the `board`, and the `status` of the game. Saving a game means saving these two objects and loading them back as required. Loading them back can be done via creation of a new game object with the parameters, or by directly setting the `board` and `status` properties on an existing object.

## Understanding the game object.

`board` is a 2-D array representing each square on a chess-board consisting of horizontal rows and vertical columns represented numerically 0-7, starting at the left WHITE ROOK as (0,0). The elements of the array are chess pieces. Each square is either a `piece` or null.

`piece` object has two properties - `color` and `type`. Import & use the ENUMS `EPieceColor` and `EPieceType` to represent these two values. Peices can be retrieved either directly from the board or by using the methods `getPiece()` or `getPieceAt()` on the game object.

`status` object gives information on the state of the game and is updated by the library after each move. It consists of the check-states of `white` and `black` Kings, castle-ability of Kings and Rooks, en-passant state of the pawns, and the general status of the game represented by `isCheckmate` or `isStalemate`. It also contains the information on whose turn it is - `currentTurn` property.

## Playing

Make a move using the `makeMove()` method. The method takes in three parameters - `startPosition`, `endPoition` and `enforceTurns`.
All positions are represented by an object with the properties `row` and `col`, corresponding to squares on the chess board. Performing a move updates the status object and the chess board, and returns any captured pieces from the move (if any, other null). Move will only be executed if it is a valid move. Invalid moves return `false`. Positions can be translated to Standard Chess Notation (A-H, 1-8) using the `translatePosition()` static method, but all inputs have to be in the format of the object type `TPosition` with `row` and `col` properties.

## Validation & Moves Generation

Valid moves can be obtained by calling `getMoves()` method, which takes in the position of the piece intending to move as it's first argument. Optional arguments include `allowSpecialMoves` (allowing castling, en passant), `preventCheck` (shows valid moves that will not put own king under check immediately).

## Misc

The library comes with static method to calculate final Elo rating for game - `calculateElo()`.

If you are using the font `CHEQ.ttf` to represent the chess peices, you can use the static method `pieceToSymbol()` to get the font-based character equivalent of each chess `piece.`

## That's all

This library is made for educational & non-commercial purpose only and may not adhere to all standards and protocols recommended by competitive/professional Chess organisations. It is used on https://chessroulett.app . You are free to use or modify it as you wish. No copyright infringement intended.


