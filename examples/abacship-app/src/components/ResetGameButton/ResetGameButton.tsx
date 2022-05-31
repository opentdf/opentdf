import React from "react";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { playerState } from "../../recoil-atoms/player";
import { putGameReset } from "../../services/axios";

export function ResetGameButton() {
  const setPlayer = useSetRecoilState(playerState);
  const handleClick = () => {
    localStorage.removeItem("player");
    setPlayer({ id: "", name: "", enemyName: "" });
    putGameReset();
  };
  return (<button className="resetGameButton" onClick={handleClick}>{"Reset Game"}</button>);
}
