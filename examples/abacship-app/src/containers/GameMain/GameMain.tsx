import React, { useCallback, useEffect } from "react";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { IPlayerState, playerState } from "../../recoil-atoms/player";
import { GameDesk } from "../GameDesk";
import { Welcome } from "../Welcome";

export function GameMain() {
  const Player = useRecoilValue(playerState);
  const setPlayerId = useSetRecoilState(playerState);

  useEffect(() => {
    const playerData = localStorage.getItem("player");
    if (playerData) {
      try {
        setPlayerId(JSON.parse(playerData));
      }
      catch (e) { }
    }
  }, []);

  const handleClick = useCallback((playerData: IPlayerState): void => {
    setPlayerId(playerData);
  }, []);
  return (
    <>
      {!Player.id ? <Welcome handleClick={handleClick} /> : <GameDesk />}
    </>
  );
}
