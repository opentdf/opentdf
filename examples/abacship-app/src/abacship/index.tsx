import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

// IMAGES
// @ts-ignore
import ocean_img from "../assets/images/ocean.jpg";
// @ts-ignore
import player_one_img from "../assets/images/player-one.jpg";
// @ts-ignore
import player_two_img from "../assets/images/player-two.jpg";
// @ts-ignore
import unknown_img from "../assets/images/unknown.jpg";
// @ts-ignore
import abacship_img from "../assets/images/abacship.jpg";

// MUSIC
// @ts-ignore
import explosion_sound from "../assets/audio/explosion.mp3"
// @ts-ignore
import splash_sound from "../assets/audio/splash.mp3"

import getTDFData from './tdfs';


const ROW_INDICATORS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
const COL_INDICATORS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];

const CELL_TYPE_OCEAN = 0;
const CELL_TYPE_PLAYER_ONE = 1;
const CELL_TYPE_PLAYER_TWO = 2;
const CELL_TYPE_UNKNOWN = 3;


const AUDIO_BASE = "/src/assets/audio";
const IMAGE_BASE = "/src/assets/images";

const BlockImage = styled.img`
  display: block;
`;

const OceanCell = function({type}:{type:number}) {
    // Return a group of images to facilitate CSS transitions.
    // Only the actual image for the cell value should be displayed at a time.
    return (
      <>
        <BlockImage alt="Unknown" src={unknown_img} className={type === CELL_TYPE_UNKNOWN ? "unknown-value" : "unknown-value unknown-value-hidden"} />
        <BlockImage alt="Ocean" src={ocean_img} className={type === CELL_TYPE_OCEAN ? "actual-value" : "actual-value-hidden"} />
        <BlockImage alt="Player One" src={player_one_img} className={type === CELL_TYPE_PLAYER_ONE ? "actual-value" : "actual-value-hidden"} />
        <BlockImage alt="Player Two" src={player_two_img} className={type === CELL_TYPE_PLAYER_TWO ? "actual-value" : "actual-value-hidden"} />
      </>
    );
}


const InlineTable = styled.table`
  display: inline-table;
`;

const SquareTd = styled.td`
  height: 50px;
  width: 50px;
`;

const SquareTdDiv = styled.div`
  width: 100%;
  height: 100%;
  transition: transform 1s;
  transform-style: preserve-3d;
  cursor: pointer;
  position: relative;
`;

const SquareTdDivFlip = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  line-height: 50px;
  text-align: center;
  font-weight: bold;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
`;

//todo fix type
// @ts-ignore
export const OceanGrid = function ({onCellClicked,grid }) {
  const onCellClickedHandler = (rowIdx: number, colIdx: number) => {
    if (rowIdx < 0 || colIdx < 0) {
      // An indicator was clicked. Ignore it.
      return;
    }

    onCellClicked(rowIdx, colIdx);
  }

  const headerColumns = [
    // First column is the corner, which does not need to say anything.
    <>&nbsp;</>,
  ];
  COL_INDICATORS.forEach(indicator => {
    headerColumns.push(<strong>{indicator}</strong>);
  });

  const rows = [headerColumns];
  ROW_INDICATORS.forEach(indicator => {
    const row = [<strong>{indicator}</strong>];
    // First row is the indicator row.
    const gridRowIndex = rows.length - 1;
    grid[gridRowIndex].forEach((gridCell: number) => {
      row.push(<OceanCell type={gridCell}/>);
    });
    rows.push(row);
  });

  return (
      <InlineTable cellSpacing="0" cellPadding="0">
        <tbody>
        {rows.map((row, rowIdx) => (
            <tr key={rowIdx}>
              {row.map((cell, colIdx) => (
                  <SquareTd
                      key={colIdx}
                      align="center"
                      onClick={() => onCellClickedHandler(rowIdx - 1, colIdx - 1)}
                  >
                    <SquareTdDiv
                        className={`index${colIdx}-${rowIdx} ${rowIdx > 0 && colIdx > 0 && grid[rowIdx - 1][colIdx - 1] !== CELL_TYPE_UNKNOWN ? 'revealed' : 'unrevealed'}`}>
                      <SquareTdDivFlip className="inner_box">
                        {cell}
                      </SquareTdDivFlip>
                    </SquareTdDiv>
                  </SquareTd>
              ))}
            </tr>
        ))}
        </tbody>
      </InlineTable>
  );
}



const CenteredDiv = styled.div`
  text-align: center;
`;

const REVEALED_CELL_TYPES = [CELL_TYPE_OCEAN, CELL_TYPE_PLAYER_ONE, CELL_TYPE_PLAYER_TWO];
function randomRevealedCell() {
  return REVEALED_CELL_TYPES[Math.floor(Math.random() * REVEALED_CELL_TYPES.length)];
}

function revealCell(rowIdx: number, colIdx: number) {
  //window.alert("rowIdx" + rowIdx + " colIdx=" + colIdx)
  window.alert("getTDFData(r,c)=" + getTDFData(rowIdx,colIdx))
  if (getTDFData(rowIdx, colIdx) === "ocean") return CELL_TYPE_OCEAN;
  if (getTDFData(rowIdx, colIdx) === "ship1") return CELL_TYPE_PLAYER_ONE;
  if (getTDFData(rowIdx, colIdx) === "ship2") return CELL_TYPE_PLAYER_TWO;
  return CELL_TYPE_PLAYER_TWO;
}

function getAudioForCell(cell: number) {
  if (cell === CELL_TYPE_OCEAN) {
    return new Audio(`${splash_sound}`);
  }
  if (cell === CELL_TYPE_PLAYER_ONE || cell === CELL_TYPE_PLAYER_TWO) {
    return new Audio(`${explosion_sound}`);
  }
  return null;
}

export default  function ABACShip() {
  const [myGrid, setMyGrid] = useState(null);
  const [opponentGrid, setOpponentGrid] = useState(null);

  const  getMyGrid = async ()=> {
    return ROW_INDICATORS.map(() => COL_INDICATORS.map(() => CELL_TYPE_UNKNOWN));
  }

  const getOpponentGrid = async () =>{
    return ROW_INDICATORS.map(() => COL_INDICATORS.map(() => CELL_TYPE_UNKNOWN));
  }

  const onInit = async ()=> {
    const _myGrid = await getMyGrid();
    const _opponentGrid = await getOpponentGrid();

    setMyGrid(_myGrid);
    setOpponentGrid(_opponentGrid);
  }

  useEffect( () => {
    onInit();
  }, [])

  const onMyCellClicked = (rowIdx: number, colIdx: number) => {
    if (myGrid[rowIdx][colIdx] !== CELL_TYPE_UNKNOWN) {
      // This cell is already revealed. Ignore this.
      return;
    }

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

    setMyGrid(newGridRows);
  };

  const onOpponentCellClicked = (rowIdx: number, colIdx: number) => {
    if (opponentGrid[rowIdx][colIdx] !== CELL_TYPE_UNKNOWN) {
      // This cell is already revealed. Ignore this.
      return;
    }

    const newGridRows: any[][] = [];
    opponentGrid.forEach((oldRow: any[], oldRowIdx: number) => {
      const newGridRow: any[] = [];
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

    setOpponentGrid(newGridRows);
  };

    if (myGrid === null || opponentGrid === null) {
      return null;
    }

    return (
      <CenteredDiv>
        <img alt="ABACShip" src={abacship_img} />
        <CenteredDiv>
          <OceanGrid grid={myGrid} onCellClicked={onMyCellClicked} />
        </CenteredDiv>
        <CenteredDiv>
          <OceanGrid grid={opponentGrid} onCellClicked={onOpponentCellClicked} />
        </CenteredDiv>
      </CenteredDiv>
    );
}
