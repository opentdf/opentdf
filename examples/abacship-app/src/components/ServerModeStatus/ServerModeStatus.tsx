import React from "react";
import { useRecoilValue } from "recoil";
import { boardState, ServerStatus } from "../../recoil-atoms/gameDeskData";
import { playerState } from "../../recoil-atoms/player";

export function ServerModeStatus() {
  const BoardState = useRecoilValue(boardState);
  const player = useRecoilValue(playerState);
  const getText = (name: string, text1: string, text2: string) => player.name === name ? text1 : text2;
  const textStatus = {
    [ServerStatus.setup]: "Generating board ...",
    [ServerStatus.backend_processing]: "Connecting ...",
    [ServerStatus.p1_grants_attr_to_p2]: getText("player1","Your've shared attribute to player 2." , "Other player has shared attribute."),
    [ServerStatus.p2_grants_attr_to_p1]: getText("player2" , "Your've shared attribute to player 2." , "Other player has shared attribute."),
    [ServerStatus.p1_request_attr_from_p2]: getText("player1", "We are requesting attribute from other player", "Other player is requesting attribute to share."),
    [ServerStatus.p2_request_attr_from_p1]: getText("player2", "We are requesting attribute from other player", "Other player is requesting attribute to share."),
    [ServerStatus.p1_turn]: getText("player1", "Your turn", "Waiting for other player to move"),
    [ServerStatus.p2_turn]: getText("player2", "Your turn", "Waiting for other player to move"),
    [ServerStatus.p1_victory]: getText("player1", "You won!", "You lose."),
    [ServerStatus.p2_victory]: getText("player2", "You won!", "You lose."),
  };

  return (
    <div className="boardStatus">
      <h1>{textStatus[BoardState.status]}</h1>
    </div>
  );
}
