import { atom } from "recoil";

export const playerState = atom({
  key: "PlayerState",
  default: {
    id: "",
    name: "",
  },
});
