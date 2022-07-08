export enum ShipType {
  AIRCRAFT = "aircraft carrier",
  BATTLESHIP = "battleship",
  CRUISER = "cruiser",
  DESTROYER = "destroyer",
  SUBMARINE = "submarine",
}

export type EmptyCell = "ocean";
export type ShipCell = `${ShipType}`; // union string from enum ????
export type CellType = `${ShipCell | EmptyCell}`; // union string from enum ????

export type SecretBoard = string[][];
export type StatusBoard = number[][];

export type BoardKeyType = "my_board" | "enemy_board" | "my_secret_board" | "enemy_secret_board";
