import { SecretBoard } from "../interfaces/board";

enum Position {
  Top = 0,
  Right,
  Bottom,
  Left,
}
interface IPoint {
  row: number;
  col: number;
}
interface ICheckedArea {
  position: Position;
  valid: boolean;
}
interface IArea extends IPoint {
  position: Position;
}

export function generateRandomBoard(boardSize: number): SecretBoard {
  // 1 battleship (size of 4 cells), 2 cruisers (size 3), 3 destroyers (size 2) and 4 submarines (size 1)
  const ships = [5, 4, 3, 2, 2, 1, 1];
  const emptyCell = "ocean";
  // const shipCell = "ship";
  let shipMap = new Map<number, string>([
    [1, "submarine"],
    [2, "destroyer"],
    [3, "cruiser"],
    [4, "battleship"],
    [5, "aircraft carrier"]
  ]);

  let board = Array.from({ length: boardSize }, () => Array(boardSize).fill(emptyCell));
  const checkArea = (board: SecretBoard, size = 0, row: number, col: number): ICheckedArea[] => {
    let valid = false;
    let result = { valid, position: Position.Top };
    let list = [];
    let boardLastIndex = board.length;
    if (board[row][col] !== emptyCell) return [result];

    // Right
    const rightLastIndex = col + size;
    if (boardLastIndex - rightLastIndex >= 0) {
      for (let i = col; i < rightLastIndex; i++) {
        valid = board[row][i] === emptyCell;
        if (!valid) break;
      }
    }

    if (valid) {
      list.push({ valid, position: Position.Right })
      valid = false;
    }

    // Bottom
    const bottomLastIndex = row + size;
    if (boardLastIndex - bottomLastIndex >= 0) {
      for (let i = row; i < bottomLastIndex; i++) {
        valid = board[i][col] === emptyCell;
        if (!valid) break;
      }
    }

    if (valid) {
      list.push({ valid, position: Position.Bottom });
      valid = false;
    }

    // Left
    const leftFirstIndex = col - size;
    if (leftFirstIndex >= 0) {
      for (let i = col; i > leftFirstIndex; i--) {
        valid = board[row][i] === emptyCell;
        if (!valid) break;
      }
    }

    if (valid) {
      list.push({ valid, position: Position.Left });
      valid = false;
    }

    // Top
    const topFirstIndex = row - size;
    if (topFirstIndex >= 0) {
      for (let i = row; i > topFirstIndex; i--) {
        valid = board[i][col] === emptyCell;
        if (!valid) break;
      }
    }

    if (valid) {
      list.push({ valid, position: Position.Top })
      valid = false;
    }

    return list;
  };

  const getRandomPlace = (board: SecretBoard, ship: number): IArea => {
    let area;
    let list: IArea[] = [];

    for (let row = 0; row < boardSize; row++) {
      for (let col = 0; col < boardSize; col++) {
        area = checkArea(board, ship, row, col);
        if (area.every(item => item.valid)) {
          area.forEach(item => list.push({ row, col, position: item.position }));
        }
      }
    }
    const randomIndex = Math.floor(Math.random() * list.length);

    return list[randomIndex];
  };

  const addShipOnBoard = (ship: number, position: Position, row: number, col: number) => {
    if (position === Position.Right || position === Position.Bottom) {
      const min = position === Position.Right ? col : row;
      for (let i = min; i < min + ship; i++) {
        let _row = position === Position.Right ? row : i,
          _col = position === Position.Right ? i : col;
        board[_row][_col] = shipMap.get(ship);
      }
    } else {
      const max = position === Position.Left ? col : row;
      for (let i = max; i > max - ship; i--) {
        let _row = position === Position.Left ? row : i,
          _col = position === Position.Left ? i : col;
        board[_row][_col] = shipMap.get(ship);
      }
    }
  };

  const boardShips = (ships: number[]) => {
    ships.forEach((ship) => {
      let place = getRandomPlace(board, ship);
      addShipOnBoard(ship, place.position, place.row, place.col);
    });
  };

  boardShips(ships);

  return board;
}
