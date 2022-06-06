import { ASSETS_LIST } from "../../assets";
import { CELL_TYPE } from "../../models/cellType";
import { getTDFData, TDFDATA } from "../../models/tdfs";
import { postBoard } from "../../services/axios";

const { SOUNDS } = ASSETS_LIST;

export function getAudioForCell(cell: number) {
  if (cell === CELL_TYPE.OCEAN) {
    return new Audio(`${SOUNDS.splash_sound}`);
  }
  if (cell === CELL_TYPE.PLAYER_ONE || cell === CELL_TYPE.PLAYER_TWO) {
    return new Audio(`${SOUNDS.explosion_sound}`);
  }
  return null;
}

export function revealCell(rowIdx: number, colIdx: number) {
  // actual hit
  const data = getTDFData(rowIdx, colIdx);

  if (data === "ocean") return CELL_TYPE.OCEAN;
  if (data === "aircraft carrier" || data === "battleship" ||
  data === "cruiser" || data === "destroyer" ||
  data === "submarine") return CELL_TYPE.PLAYER_ONE;
  if (data === "aircraft carrier" || data === "battleship" ||
  data === "cruiser" || data === "destroyer" ||
  data === "submarine") return CELL_TYPE.PLAYER_TWO; // yeah , i know , prob i'll delete this
}

export const hitGridItem = (myGrid: number[][], rowIdx: number, colIdx: number) => {
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

export const sendBoard = async (player: string) => {
  const token = sessionStorage.getItem("token") || "";
  const refreshToken = sessionStorage.getItem("refreshToken") || "";
  postBoard(token, refreshToken, player, TDFDATA);
};
