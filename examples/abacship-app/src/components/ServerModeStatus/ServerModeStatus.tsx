import React from "react";
import { useRecoilValue } from "recoil";
import { boardState, ServerStatus } from "../../recoil-atoms/gameDeskData";
import { playerState } from "../../recoil-atoms/player";

export function ServerModeStatus() {
  const BoardState = useRecoilValue(boardState);
  const player = useRecoilValue(playerState);
  const getText = (name: string, text1: string, text2: string) => player.name === name ? text1 : text2;

  const yourTurn = "It’s your turn!";
  const waitingPlayer1 = "Waiting on Player 1";
  const waitingPlayer2 = "Waiting on Player 2";
  const player1TextTemplate = getText("player1", yourTurn, waitingPlayer1);
  const player2TextTemplate = getText("player2", yourTurn, waitingPlayer2);

  const textStatus = {
    [ServerStatus.setup]: "Generating board ...",
    [ServerStatus.backend_processing]: "Connecting ...",
    [ServerStatus.p1_grants_attr_to_p2]: player1TextTemplate,
    [ServerStatus.p2_grants_attr_to_p1]: player2TextTemplate,
    [ServerStatus.p1_request_attr_from_p2]: player1TextTemplate,
    [ServerStatus.p2_request_attr_from_p1]: player2TextTemplate,
    [ServerStatus.p1_turn]: player1TextTemplate,
    [ServerStatus.p2_turn]: player2TextTemplate,
    [ServerStatus.p1_victory]: getText("player1", "You won!", "You lose."),
    [ServerStatus.p2_victory]: getText("player2", "You won!", "You lose."),
  };

  return (
    <div className="boardStatus">
      <h1>{textStatus[BoardState.status]}</h1>
    </div>
  );
}
