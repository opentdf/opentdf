import { atom } from "recoil";

export const playerState = atom({
  key: "PlayerState",
  default: {
    id: "",
    name: "",
    enemyName:"",
  },
});

export const playerMoveState = atom({
  key: "PlayerMoveState",
  default: {
    isYourTurn: false,
  },
});
