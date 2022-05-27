import React, { useCallback, useEffect } from "react";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { playerState } from "../../recoil-atoms/player";
import { GameDesk } from "../GameDesk";
import { Welcome } from "../Welcome";
import { usePingServer } from "../../hooks/usePingServer";
import { boardState, ServerStatus } from "../../recoil-atoms/gameDeskData";

export function GameMain() {
  const playerId = useRecoilValue(playerState);
  const setPlayerId = useSetRecoilState(playerState);

  const handleClick = useCallback((player: string, enemy:string): void => {
    setPlayerId({ id: player, name: player, enemyName: enemy });
  }, []);
  return (
    <>
      {!playerId.id ? <Welcome handleClick={handleClick} /> : <GameDesk />}
    </>
  );
}
