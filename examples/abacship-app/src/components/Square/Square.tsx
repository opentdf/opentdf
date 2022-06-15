// Assets
import React from "react";
import { ASSETS_LIST } from "../../assets";
import { TypeBoardPosition } from "../../interfaces/board";
import { CELL_TYPE } from '../../models/cellType';
import "./Square.scss";

const { IMAGES } = ASSETS_LIST;

export function Square({ type, position = "left" }: { type: number, position: TypeBoardPosition }) {
  // Return a group of images to facilitate CSS transitions.
  // Only the actual image for the cell value should be displayed at a time.

  return (
    <>
      <div className={`unknown_cell ${position} ${type === CELL_TYPE.UNKNOWN ? "actual-value" : "value-hidden"}`}>?</div>
      <div className={`ocean_cell ${position} ${type === CELL_TYPE.OCEAN ? "actual-value" : "value-hidden"}`}></div>
      <div className={`player_cell ${type === CELL_TYPE.PLAYER_ONE ? "actual-value" : "value-hidden"}`}></div>
      <div
        className={`hit_cell ${type === CELL_TYPE.ENEMY_MISS ? "actual-value" : "value-hidden"}`}>
        <div className="lineA"></div>
        <div className="lineB"></div>
      </div>
      <img alt="Player Active" src={IMAGES.player_active_img}
        className={`active-border ${type === CELL_TYPE.PLAYER_ONE ? "actual-value" : "value-hidden"}`}
      />
      <img alt="Player Gray" src={IMAGES.player_gray_img}
        className={`gray-border ${type === CELL_TYPE.PLAYER_TWO ? "actual-value" : "value-hidden"}`}
      />
    </>
  );
}
