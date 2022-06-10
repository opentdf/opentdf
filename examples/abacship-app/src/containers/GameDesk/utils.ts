import { ASSETS_LIST } from "../../assets";
import { BoardKeyType, SecretBoard, ShipType, StatusBoard } from "../../interfaces/board";
import { CELL_TYPE, COL_INDICATORS, ROW_INDICATORS } from "../../models/cellType";
import { defaulBoardSize, getBoard, setBoard } from "../../utils/board";
import { generateRandomBoard } from "../../utils/randomBoard";

const { SOUNDS } = ASSETS_LIST;

export function getAudioForCell(cell: number) {
  if (cell === CELL_TYPE.OCEAN) {
    return new Audio(`${SOUNDS.splash_sound}`);
  }
  if (cell === CELL_TYPE.PLAYER_ONE || cell === CELL_TYPE.PLAYER_TWO) {
    return new Audio(`${SOUNDS.explosion_sound}`);
  }
  return null;
}

export function revealCell(value: string) {
  if (value === "ocean") return CELL_TYPE.OCEAN;
  if (Object.values(ShipType).includes(value as unknown as ShipType)) return CELL_TYPE.PLAYER_ONE;
  // if (Object.values(ShipType).includes(data as unknown as ShipType)) return CELL_TYPE.PLAYER_TWO; // todo player two
}

export const hitGridItem = (statusBoard: number[][], rowIdx: number, colIdx: number, secretValue: string) => {
  return statusBoard.map((oldRow: number[], oldRowIdx: number) => {
    return oldRow.map((oldCell, oldColIdx) => {
      if (rowIdx === oldRowIdx && colIdx === oldColIdx) {
        // This is the cell we are revealing.
        // const _secret_board = getBoard<>();
        const cell = revealCell(secretValue);
        const audioForCell = getAudioForCell(cell);
        if (audioForCell !== null) {
          audioForCell.play();
        }
        return cell;
      } else {
        return oldCell;
      }
    });
  });
};

export const getMyGrid = async (): Promise<number[][]> => {
  const boardKey = "my_secret_board";
  const localBoard = getBoard<SecretBoard>(boardKey);
  let board: SecretBoard;
  if (localBoard.length === 0) {
    const randomBoard = generateRandomBoard(defaulBoardSize);
    setBoard(boardKey, randomBoard);
    board = randomBoard;
  } else {
    board = localBoard;
  }

  return board.map((row, rowIdx) => row.map((cell, colIdx) => revealCell(cell)));
}

export const getOpponentGrid = async (): Promise<number[][]> => {
  const boardKey = "enemy_board";
  const localBoard = getBoard<StatusBoard>(boardKey);
  const emptyBoard = ROW_INDICATORS.map(() => COL_INDICATORS.map(() => CELL_TYPE.UNKNOWN));
  let board;
  if (localBoard.length === 0) {
    setBoard(boardKey, emptyBoard);
    board = emptyBoard;
  } else {
    board = localBoard;
  }

  return board;
}
