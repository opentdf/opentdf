import React, { useEffect, useState } from "react";
import { useRecoilValue } from "recoil";
import { boardMessageData } from "../../recoil-atoms/gameDeskData";
import styles from "./PopupMessage.module.scss";

interface IPopupMessage {
  position: string;
}

export const BOARD_POPUP_MESSAGE = {
  ENEMY_HIT: "Oh no! A hit.",
  ENEMY_MISS: "They missed!",
  HIT: "Hit :)",
  MISS: "Miss :("
};

export function PopupMessage({ position }: IPopupMessage) {
  const messageData = useRecoilValue(boardMessageData);
  const [timer, setTimer] = useState<null | NodeJS.Timeout>(null);
  const [isShow, setIsShow] = useState(false);
  useEffect(() => {
    return function cleanup() {
      clearTimeout(timer);
    }
  }, []);
  useEffect(() => {
    if (messageData.position === position) {
      setIsShow(true);
      setTimer(setTimeout(() => {
        setIsShow(false);
      }, 2000));
    }
  }, [messageData]);

  return (
    isShow === true ? (
      <div className={styles.container} >
        <div className={styles.content}>
          <p className={styles.message}>{messageData.message}</p>
        </div>
      </div>) : <></>
  );
}
