export const TDFDATA = [
  ["aircraft carrier", "ocean", "ocean", "ocean", "ocean", "destroyer", "destroyer", "ocean", "ocean", "ocean"],
  ["aircraft carrier", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "destroyer", "ocean"],
  ["aircraft carrier", "ocean", "ocean", "ocean", "cruiser", "cruiser", "cruiser", "ocean", "destroyer", "ocean"],
  ["aircraft carrier", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean"],
  ["aircraft carrier", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean"],
  ["ocean", "ocean", "ocean", "battleship", "battleship", "battleship", "battleship", "ocean", "ocean", "ocean"],
  ["ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean"],
  ["ocean", "submarine", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean"],
  ["ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "submarine", "ocean", "ocean"],
  ["ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean"]
];

export function getTDFData(row: number, col: number) {
  return TDFDATA[row][col];
}
