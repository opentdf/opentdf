export const TDFDATA = [
  ["ship", "ocean", "ocean", "ocean", "ocean", "ship", "ship", "ocean", "ocean", "ocean"],
  ["ship", "ship", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ship", "ocean"],
  ["ship", "ship", "ocean", "ocean", "ship", "ship", "ship", "ocean", "ship", "ocean"],
  ["ship", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean"],
  ["ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ship", "ocean"],
  ["ocean", "ocean", "ocean", "ocean", "ship", "ship", "ship", "ocean", "ocean", "ocean"],
  ["ocean", "ocean", "ocean", "ship", "ocean", "ocean", "ocean", "ocean", "ship", "ocean"],
  ["ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean"],
  ["ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ship", "ocean", "ocean"],
  ["ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean", "ocean"],
];

export function getTDFData(row: number, col: number) {
  return TDFDATA[row][col];
}
