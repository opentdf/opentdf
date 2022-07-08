import React from "react";
import { Square } from "../Square";
import { CELL_TYPE, COL_INDICATORS, ROW_INDICATORS } from "../../models/cellType";
import "./Board.scss";

interface IBoard {
  onCellClicked: (rowId: number, colId:number) => void,
  grid: number[][],
}

export function Board({ onCellClicked, grid }: IBoard) {
  const onCellClickHandler = (rowIdx: number, colIdx: number) => {
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
      row.push(<Square type={gridCell}/>);
    });
    rows.push(row);
  });
  const isRevealed = (rowIdx: number, colIdx: number, grid: number[][]): string => {
    return rowIdx > 0 && colIdx > 0 && grid[rowIdx - 1][colIdx - 1] !== CELL_TYPE.UNKNOWN ? 'revealed' : 'unrevealed';
  }

  return (<div className="playerBoard">
    {rows.map((row, rowIdx) => (
      <div className="boardRow" key={rowIdx}>
        {row.map((cell, colIdx) => (
          <div
            className={`boardItem index${colIdx}-${rowIdx} ${isRevealed(rowIdx, colIdx, grid)} ${colIdx!==0 && rowIdx!==0?"item":""}`}
            key={colIdx}
            onClick={() => onCellClickHandler(rowIdx - 1, colIdx - 1)}
          >
            {cell}
          </div>
        ))}
      </div>
    ))}
  </div>)
}
