import { ASSETS_LIST } from "../../assets";
import { CELL_TYPE } from "../../models/cellType";

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