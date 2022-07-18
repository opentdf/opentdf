import React from "react";
import styles from "./PlayerNameTitle.module.scss";

export function PlayerNameTitle({ playerName }: { playerName: string }) {
  let text;
  let nameTitle;
  if (playerName === "player1") {
    text = "Your board ";
    nameTitle = "(Player 1)";
  } else {
    text = "Enemy's board ";
    nameTitle = "(Player 2)";
  }

  return (
    <div className={styles.container}>
      <span className={styles.playerTitle}>{text}</span>
      <span className={styles.playerName}>&nbsp;{nameTitle}</span>
    </div>
  );
};
