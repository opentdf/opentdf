import React, { useEffect, useState } from 'react';
import './GameDesk.scss';
// Assets
import { ASSETS_LIST } from "../../assets";
const { IMAGES } = ASSETS_LIST;

import {
  CELL_TYPE,
  COL_INDICATORS,
  ROW_INDICATORS,
} from '../../models/cellType';

import { getTDFData } from '../../models/tdfs';
import { Board } from "../../components/Board";
import { getAudioForCell } from './utils';
import { useRecoilValue } from 'recoil';
import { playerState } from '../../recoil-atoms/player';

function revealCell(rowIdx: number, colIdx: number) {
  // actual hit
  const data = getTDFData(rowIdx, colIdx);

  if (data === "ocean") return CELL_TYPE.OCEAN;
  if (data === "ship1") return CELL_TYPE.PLAYER_ONE;
  if (data === "ship2") return CELL_TYPE.PLAYER_TWO;
  return CELL_TYPE.PLAYER_TWO;
}

export function GameDesk() {
  const [myGrid, setMyGrid] = useState<number[][] | null>(null);
  const [opponentGrid, setOpponentGrid] = useState<number[][] | null>(null);
  const playerData = useRecoilValue(playerState);

  const getMyGrid = async ():Promise<number[][]> => {
    return ROW_INDICATORS.map(() => COL_INDICATORS.map(() => CELL_TYPE.UNKNOWN));
  }

  const getOpponentGrid = async ():Promise<number[][]> => {
    return ROW_INDICATORS.map(() => COL_INDICATORS.map(() => CELL_TYPE.UNKNOWN));
  }

  const generateGrids = async (): Promise<void> => {
    const _myGrid = await getMyGrid();
    const _opponentGrid = await getOpponentGrid();

    setMyGrid(_myGrid);
    setOpponentGrid(_opponentGrid);
  }

  useEffect(() => {
    generateGrids();
  }, [])

  const checkGridClick = (myGrid: number[][], rowIdx: number, colIdx: number) => {
    const newGridRows: number[][] = [];
    myGrid.forEach((oldRow: any[], oldRowIdx: number) => {
      const newGridRow: number[] = [];
      oldRow.forEach((oldCell, oldColIdx) => {
        if (rowIdx === oldRowIdx && colIdx === oldColIdx) {
          // This is the cell we are revealing.
          const cell = revealCell(rowIdx, colIdx);
          const audioForCell = getAudioForCell(cell);
          if (audioForCell !== null) {
            audioForCell.play();
          }
          newGridRow.push(cell);
        } else {
          newGridRow.push(oldCell);
        }
      });
      newGridRows.push(newGridRow);
    });

    return newGridRows;
  };
  const onMyCellClicked = (rowIdx: number, colIdx: number) => {
    if (myGrid[rowIdx][colIdx] !== CELL_TYPE.UNKNOWN) {
      // This cell is already revealed. Ignore this.
      return;
    }

    setMyGrid(checkGridClick(myGrid, rowIdx, colIdx));
  };

  const onOpponentCellClicked = (rowIdx: number, colIdx: number) => {
    if (opponentGrid[rowIdx][colIdx] !== CELL_TYPE.UNKNOWN) {
      // This cell is already revealed. Ignore this.
      return;
    }

    setOpponentGrid(checkGridClick(opponentGrid, rowIdx, colIdx));
  };

  if (myGrid === null || opponentGrid === null) {
    return null;
  }

  return (
    <div className="centered">
      <div>
        <img alt="ABACShip" src={IMAGES.abacship_img}/>
        <div className="board1">
          <h1>{`You are ${playerData.name}`}</h1>
          <Board grid={myGrid} onCellClicked={onMyCellClicked}/>
        </div>
        <div className="board2">
          <h1>{"Enemy"}</h1>
          <Board grid={opponentGrid} onCellClicked={onOpponentCellClicked}/>
        </div>
      </div>
    </div>
  );
}
