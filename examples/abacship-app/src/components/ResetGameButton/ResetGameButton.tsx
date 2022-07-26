import React from "react";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { playerState } from "../../recoil-atoms/player";
import { putGameReset } from "../../services/axios";

export function ResetGameButton() {
  const setPlayer = useSetRecoilState(playerState);
  const handleClick = () => {
    putGameReset();
    setPlayer({ id: "", name: "", enemyName: "" });
    ["player", "enemy_board", "my_board", "my_secret_board"].forEach(key => localStorage.removeItem(key));
  };
  return (<button className="resetGameButton" onClick={handleClick}>{"Reset Game"}</button>);
}
