import { atom } from "recoil";
import { TDFDATA } from "../models/tdfs";

export enum ServerStatus {
  backend_processing = 0,
  setup = 1,
  p1_turn = 2,
  p2_turn = 3,
  p1_request_attr_from_p2 = 4,
  p2_request_attr_from_p1 = 5,
  p1_grants_attr_to_p2 = 6,
  p2_grants_attr_to_p1 = 7,
  p1_victory = 8,
  p2_victory = 9,
}

export const boardState = atom({
  key: "BoardStatus",
  default: {
    status: ServerStatus.setup
  }
});

export const player1Board = atom({
  key: "Player1Board",
  default: TDFDATA
});

export const player2Board = atom({
  key: "Player2Board",
  default: TDFDATA
});

export const boardMessageData = atom({
  key: "BoardMessageData",
  default: {
    position: "",
    message: ""
  }
});
