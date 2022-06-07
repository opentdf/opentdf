// Assets
import React from "react";
import { ASSETS_LIST }  from "../../assets";
import { CELL_TYPE } from '../../models/cellType';
import "./Square.scss";

const { IMAGES } = ASSETS_LIST;

export function Square({type}:{type:number}) {
    // Return a group of images to facilitate CSS transitions.
    // Only the actual image for the cell value should be displayed at a time.

    return (
        <>
            <img alt="Unknown" src={IMAGES.unknown_img} className={type === CELL_TYPE.UNKNOWN ? "unknown-value" : "unknown-value value-hidden"} />
            <img alt="Ocean" src={IMAGES.ocean_img} className={type === CELL_TYPE.OCEAN ? "actual-value" : "value-hidden"} />
            <img alt="Player One" src={IMAGES.player_one_img} className={type === CELL_TYPE.PLAYER_ONE ? "actual-value" : "value-hidden"} />
        </>
    );
}
