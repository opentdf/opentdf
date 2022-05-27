import axios from 'axios';
import { GAME_SERVER_BASE_URL } from "../config";
import { ServerStatus } from "../recoil-atoms/gameDeskData";
import { ICheckSquareResponse, IGrandAccess, IServerBoards, IServerPostBoardResponse } from "../interfaces/gameData";

export const axiosRequest = async (requestType: "get" | "post", url:string, bodyData?: any) => {
  try {
    const { data } = await axios[requestType](url, bodyData);

    return data;
  } catch (error) {
    console.error(error);
  }
};

export async function pingServer(): Promise<ServerStatus> {
  return axiosRequest("get", `${GAME_SERVER_BASE_URL}/status`);
}

export async function getBoard(): Promise<IServerBoards> {
  return axiosRequest("get", `${GAME_SERVER_BASE_URL}/board`);
}


export async function postBoard(access_token: string , refresh_token: string, board: string[][] = [] ): Promise<IServerPostBoardResponse> {
  return axiosRequest("post", `${GAME_SERVER_BASE_URL}/board?access_token=${access_token}&refresh_token=${refresh_token}`, board);
}

export async function postGrandAccess(dataInfo:IGrandAccess): Promise<ServerStatus> {
  return axiosRequest("post", `${GAME_SERVER_BASE_URL}/grant`, dataInfo);
}

export async function requestCheckSquare(rowId:number, colId:number, dataInfo:IGrandAccess ): Promise<ICheckSquareResponse> {
  return axiosRequest("post", `${GAME_SERVER_BASE_URL}/check/square?row=${rowId}&col=${colId}`, dataInfo);
}

