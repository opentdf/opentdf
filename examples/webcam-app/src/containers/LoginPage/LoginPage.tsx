import { memo, useState } from "react";
import { Button } from "../../components/Button";
import styles from "./LoginPage.module.scss";

const random = () => Math.floor(Math.random() * 1000000);
const User = memo(function ({ name = "", hashtags = [] }: { name: string, hashtags: string[] }) {
    return (<div className={styles.user}>
        <div className={styles.avatar}></div>
        <div className={styles.userInfo}>
            <p className={styles.userName}>{name}</p>
            {hashtags.map(hashtag => <p key={`id${random()}-${hashtag}`} className={styles.hashtag}>{`#${hashtag}`}</p>)}
        </div>
    </div>);
});

const defaultUsers = [
    {
        name: "User1",
        hashtags: ["paiduser", "adult"]
    },
    {
        name: "User2",
        hashtags: ["paiduser", "minor"]
    },
    {
        name: "User3",
        hashtags: ["evesdropper"]
    }
];
export const LoginPage = function LoginPage() {
    const [users, setUsers] = useState(defaultUsers);
    return (
        <div className={styles.container}>
            <div className={styles.title}>Log in as three people</div>
            <div className={styles.usersList}>
                {users.map(({ name, hashtags }) => <User key={name} name={name} hashtags={hashtags} />)}
            </div>
            <div className={styles.loginAction}>
                <Button title="Log in as everyone" />
            </div>
        </div>
    );
};