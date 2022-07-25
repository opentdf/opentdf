import { FC } from "react";
import styles from "./UserCard.module.scss";

interface IUserCard {
    name: string;
    hashtags: string[];
    active?: boolean;
}
export const UserCard: FC<IUserCard> = function UserCard({ name = "", hashtags = [], active }) {
    return (
        <div className={`${styles.user} ${active ? styles.active : ""}`}>
            <div className={styles.avatar}></div>
            <div className={styles.userInfo}>
                <p className={styles.userName}>{name}</p>
                {hashtags.map(hashtag => <p key={`id${name}-${hashtag}`} className={styles.hashtag}>{`#${hashtag}`}</p>)}
            </div>
        </div>
    );
};