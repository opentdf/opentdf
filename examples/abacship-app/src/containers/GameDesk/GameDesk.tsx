import React, { useEffect, useState } from 'react';
import { CELL_TYPE } from '../../models/cellType';
import { Board } from "../../components/Board";
import { getMyGrid, getOpponentGrid, hitGridItem, shareAccess } from './utils';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { playerState } from '../../recoil-atoms/player';
import { boardState, ServerStatus } from "../../recoil-atoms/gameDeskData";
import { requestCheckSquare } from "../../services/axios";
import { usePingServer } from "../../hooks/usePingServer";
import { useClientTDF } from "../../hooks/useClientTDF";
import { ServerModeStatus } from '../../components/ServerModeStatus';
import { ResetGameButton } from '../../components/ResetGameButton';
import { sendBoard, setBoard } from '../../utils/board';
import { PlayerNameTitle } from '../../components/PlayerNameTitle';
import './GameDesk.scss';
import { TypeBoardPosition } from '../../interfaces/board';

export function GameDesk() {
  const [myGrid, setMyGrid] = useState<number[][] | null>(null);
  const [opponentGrid, setOpponentGrid] = useState<number[][] | null>(null);
  const { status: currentServerStatus } = useRecoilValue(boardState);
  const setServerStatus = useSetRecoilState(boardState)
  const { startPing, stopPing } = usePingServer();
  const { setTextToDecrypt, decryptedText, decryptString } = useClientTDF();
  const playerData = useRecoilValue(playerState);
  const generateGrids = async (): Promise<void> => {
    const _myGrid = await getMyGrid();
    const _opponentGrid = await getOpponentGrid();

    setMyGrid(_myGrid);
    setOpponentGrid(_opponentGrid);
  }

  useEffect(() => {
    generateGrids();
    startPing();

    return function () {
      stopPing();
    }
  }, []);

  useEffect(() => {
    if (currentServerStatus === ServerStatus.p1_victory || currentServerStatus === ServerStatus.p2_victory) {
      stopPing();
    }

    // SETUP
    if (currentServerStatus === ServerStatus.setup) {
      // prevent future boardNewSetup
      const player = () => localStorage.getItem("player");
      if (playerData.name !== "" && player() === null) {
        console.log('Board');
        sendBoard(playerData.name);
        localStorage.setItem("player", JSON.stringify(playerData));
      }
    }

    // GRANT ATTR
    if (currentServerStatus === ServerStatus.p1_grants_attr_to_p2 && playerData.name === "player1") {
      // PLAYER 1
    }

    if (currentServerStatus === ServerStatus.p2_grants_attr_to_p1 && playerData.name === "player2") {
      //PLAYER 2
    }

    // REQUEST ATTR
    if (currentServerStatus === ServerStatus.p1_request_attr_from_p2 && playerData.name === "player2") {
      // PLAYER 1
      shareAccess(playerData.name);
    }

    if (currentServerStatus === ServerStatus.p2_request_attr_from_p1 && playerData.name === "player1") {
      //PLAYER 2
      shareAccess(playerData.name);
    }

    // PLAYER TURN
    if (currentServerStatus === ServerStatus.p1_turn) {
      // PLAYER 1

    }

    if (currentServerStatus === ServerStatus.p2_turn) {
      //PLAYER 2

    }
  }, [currentServerStatus, playerData]);

  const onMyCellClicked = (rowIdx: number, colIdx: number) => {
  };
  const onOpponentCellClicked = async (rowIdx: number, colIdx: number) => {
    if (opponentGrid[rowIdx][colIdx] !== CELL_TYPE.UNKNOWN) {
      // This cell is already revealed. Ignore this.
      return;
    }
    // Player move limit
    if ((playerData.name === "player1" && currentServerStatus === ServerStatus.p1_turn) || (playerData.name === "player2" && currentServerStatus === ServerStatus.p2_turn)) {
      setServerStatus({ status: ServerStatus.backend_processing });

      const token = sessionStorage.getItem("token") || "";
      const refreshToken = sessionStorage.getItem("refreshToken") || "";

      const dataInfo = {
        name: playerData.name,
        refresh_token: refreshToken,
        access_token: token,
      };

      const data = await requestCheckSquare(rowIdx, colIdx, dataInfo);
      const enemyName = playerData.name === "player1" ? "player2" : "player1";
      const _data = {
        access_token: data.player_info.access_token,
        refresh_token: data.player_info.refresh_token,
        cypher_text: data?.encrypted_string,
      };
      console.log("Enemy name = ", enemyName);
      const secretValue = await decryptString(_data);
      const newStatusBoard = hitGridItem(opponentGrid, rowIdx, colIdx, secretValue)
      setBoard("enemy_board", newStatusBoard);
      setOpponentGrid(newStatusBoard);
    }
  };

  if (myGrid === null || opponentGrid === null) {
    return (<></>);
  }

  const renderBoard = (position: TypeBoardPosition, isEnemy: boolean) => {
    return (
      <div className="board1">
        <PlayerNameTitle playerName={isEnemy ? playerData.enemyName : playerData.name} />
        <Board position={position} grid={isEnemy ? opponentGrid : myGrid} onCellClicked={isEnemy ? onOpponentCellClicked : onMyCellClicked} />
      </div>
    );
  };
  const renderDesk = () => {
    const normalFlow = playerData.name === "player1";
    const board1 = renderBoard("left", !normalFlow),
      board2 = renderBoard("right", normalFlow);
    return [board1, board2];
  };

  return (
    <div className="mainContainer">
      <div className="wrapper">
        <ServerModeStatus />
        <div className="boardsDesk">
          {renderDesk()}
        </div>
        <div className="resetGamePanel"><ResetGameButton /></div>
        <div className="rules">
          <h3>
            There must be one aircraft carrier (size 5), one battleship (size 4), one cruiser (size 3), 2 destroyers (size 2) and 2 submarines (size 1).
            Any additional ships or missing ships are not allowed. To win you must sink all of your opponent's ships.
          </h3>
        </div>
      </div>
    </div>
  );
}
