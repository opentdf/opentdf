import React from "react";
import { Square } from "../Square";
import { CELL_TYPE, COL_INDICATORS, ROW_INDICATORS } from "../../models/cellType";
import "./Board.scss";
import { TypeBoardPosition } from "../../interfaces/board";
import { PopupMessage } from "../PopupMessage";

interface IBoard {
  onCellClicked: (rowId: number, colId: number) => void,
  grid: number[][],
  position: TypeBoardPosition
}

export function Board({ onCellClicked, grid, position = "left" }: IBoard) {
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
    headerColumns.push(<span key={`${position} 0-${indicator}`} className="boardLabel">{indicator}</span>);
  });

  const rows = [headerColumns];
  ROW_INDICATORS.forEach(indicator => {
    const row = [<span className="boardLabel">{indicator}</span>];
    // First row is the indicator row.
    const gridRowIndex = rows.length - 1;
    grid[gridRowIndex].forEach((gridCell: number) => {
      row.push(<Square key={`${position} ${indicator}-${gridCell}`} type={gridCell} position={position} />);
    });
    rows.push(row);
  });
  const isRevealed = (rowIdx: number, colIdx: number, grid: number[][]): string => {
    return rowIdx > 0 && colIdx > 0 && grid[rowIdx - 1][colIdx - 1] !== CELL_TYPE.UNKNOWN ? 'revealed' : 'unrevealed';
  }

  return (<div className={`playerBoard ${position}`}>
    {rows.map((row, rowIdx) => (
      <div className="boardRow" key={rowIdx}>
        {row.map((cell, colIdx) => (
          <div
            className={`boardItem index${colIdx}-${rowIdx} ${isRevealed(rowIdx, colIdx, grid)} ${colIdx !== 0 && rowIdx !== 0 ? "item" : ""}`}
            key={colIdx}
            onClick={() => onCellClickHandler(rowIdx - 1, colIdx - 1)}
          >
            {cell}
          </div>
        ))}
      </div>
    ))}
    <PopupMessage position={position} />
  </div>)
}
