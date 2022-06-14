import { BoardKeyType, SecretBoard, StatusBoard } from "../interfaces/board";
import { postSecretBoard } from "../services/axios";

export const defaulBoardSize = 10;
export function setBoard(boardKey: BoardKeyType, board: StatusBoard | SecretBoard): void {
  localStorage.setItem(boardKey, JSON.stringify(board));
}

export function getBoard<BoardType>(boardKey: BoardKeyType): BoardType {
  let board;
  const localBoard = localStorage.getItem(boardKey);
  if (localBoard === null) {
    board = [];
  } else {
    board = JSON.parse(localBoard);
  }

  return board;
}

export const sendBoard = async (player: string) => {
  const token = sessionStorage.getItem("token") || "";
  const refreshToken = sessionStorage.getItem("refreshToken") || "";

  const myBoard = getBoard<SecretBoard>("my_secret_board");
  postSecretBoard(token, refreshToken, player, myBoard);
};
