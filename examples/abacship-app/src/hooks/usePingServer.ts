import { useCallback, useEffect, useState } from "react";
import { pingServer } from "../services/axios";
import { boardState, ServerStatus } from "../recoil-atoms/gameDeskData";
import { useSetRecoilState } from "recoil";

export function usePingServer() {
  const [status, setStatus] = useState<ServerStatus>(ServerStatus.backend_processing);
  const [pingId, setPingId] = useState<any>(null);
  const setServerStatus = useSetRecoilState(boardState);
  const startPing = useCallback((): void => {
      return setPingId(setInterval(async () => {
          const serverStatus = await pingServer();
          setStatus(serverStatus);
          return serverStatus;
      }, 5000));
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
