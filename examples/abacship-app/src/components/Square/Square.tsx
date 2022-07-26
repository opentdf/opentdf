// Assets
import React from "react";
import { useRecoilValue } from "recoil";
import { ASSETS_LIST } from "../../assets";
import { TypeBoardPosition } from "../../interfaces/board";
import { CELL_TYPE } from '../../models/cellType';
import { playerState } from "../../recoil-atoms/player";
import "./Square.scss";

const { IMAGES } = ASSETS_LIST;

export function Square({ type, position = "left" }: { type: number, position: TypeBoardPosition }) {
  // Return a group of images to facilitate CSS transitions.
  // Only the actual image for the cell value should be displayed at a time.
  const { name } = useRecoilValue(playerState);
  console.log('render cell');
  const isPlayerOneShip = type === CELL_TYPE.UNKNOWN_SHIP_HIT && position === "left";
  const isPlayerTwoShip = type === CELL_TYPE.UNKNOWN_SHIP_HIT && position === "right";

  return (
    <>
      <div className={`unknown_cell ${position} ${type === CELL_TYPE.UNKNOWN ? "actual-value" : "value-hidden"}`}>?</div>
      <div className={`unknown_cell_hit ${position} ${type === CELL_TYPE.UNKNOWN_OCEAN_HIT ? "actual-value" : "value-hidden"}`}>
        <div className="lineA"></div>
        <div className="lineB"></div>
      </div>
      <div className={`ocean_cell ${position} ${type === CELL_TYPE.OCEAN ? "actual-value" : "value-hidden"}`}></div>
      <div className={`ocean_cell_hit ${position} ${type === CELL_TYPE.OCEAN_HIT ? "actual-value" : "value-hidden"}`}></div>
      <div className={`ship_cell_hit ${position} ${type === CELL_TYPE.SHIP_HIT ? "actual-value" : "value-hidden"}`}></div>
      <img alt="Player 1" src={IMAGES.player_active_img}
        className={`player_one ${type === CELL_TYPE.PLAYER_ONE || isPlayerOneShip ? "actual-value" : "value-hidden"}`}
      />
      <img alt="Player 2" src={IMAGES.player_gray_img}
        className={`player_two ${type === CELL_TYPE.PLAYER_TWO || isPlayerTwoShip ? "actual-value" : "value-hidden"}`}
      />
    </>
  );
}
