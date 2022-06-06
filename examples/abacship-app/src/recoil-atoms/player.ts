import { atom } from "recoil";

export interface IPlayerState {
  id: string;
  name: string;
  enemyName: string;
}

export const playerState = atom({
  key: "PlayerState",
  default: {
    id: "",
    name: "",
    enemyName: "",
  },
});

export const playerMoveState = atom({
  key: "PlayerMoveState",
  default: {
    isYourTurn: false,
  },
});
