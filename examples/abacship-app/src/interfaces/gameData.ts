import { ServerStatus } from "../recoil-atoms/gameDeskData";

export interface IServerBoards {
  player1: string [][];
  player2: string [][];
}

export interface IPlayerServerInfo {
  "name": string;//"player1",
  "refresh_token": string;//"the refresh token ...",
  "access_token": string; //"the access token ..."
}
export interface IServerPostBoardResponse {
  "player_info": IPlayerServerInfo;
  "status": ServerStatus;
}

export interface IGrandAccess extends IPlayerServerInfo {
  "username"?: string;
}

export interface ICheckSquareResponse {
  "player_info": IPlayerServerInfo;
  "full_board": IServerBoards;
  "status": ServerStatus;
}
