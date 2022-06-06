import { useCallback, useEffect, useState } from "react";
import { pingServer } from "../services/axios";
import { boardState, ServerStatus } from "../recoil-atoms/gameDeskData";
import { AxiosResponse } from "axios";
import { useSetRecoilState } from "recoil";

export function usePingServer() {
  const [status, setStatus] = useState<ServerStatus>(ServerStatus.backend_processing);
  const [pingId, setPingId] = useState<NodeJS.Timer | null>(null);
  const setServerStatus = useSetRecoilState(boardState);
  const startPing = useCallback((): void => {
    setPingId(setInterval(async () => {
      const data = await pingServer();

      setStatus(data);
    }, 5000))
  }, []);
  const stopPing = useCallback((): void => {
    clearInterval(pingId);
  }, [pingId]);

  useEffect(() => {
    console.log("STATUS = ", ServerStatus[status]);
    setServerStatus({ status });
  }, [status])

  return { status, startPing, stopPing };
}
