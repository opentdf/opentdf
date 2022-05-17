import React, { useCallback } from "react";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { playerState } from "../../recoil-atoms/player";
import { GameDesk } from "../GameDesk";
import { Welcome } from "../Welcome";

export function GameMain() {
  const playerId = useRecoilValue(playerState);
  const setPlayerId = useSetRecoilState(playerState);

  const handleClick = useCallback((value: string): void => {
    setPlayerId({ id: value, name: value });
  }, []);
  return (
    <>
      {!playerId.id ? <Welcome handleClick={handleClick} /> : <GameDesk />}
    </>
  );
}
