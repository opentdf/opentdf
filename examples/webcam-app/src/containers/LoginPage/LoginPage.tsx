import { useState } from "react";
import { Button } from "../../components/Button";
import { UserList } from "../../components/UserList";
import { Main } from "../Main";
import styles from "./LoginPage.module.scss";

export const defaultUsers = [
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
export const LoginPage = function LoginPage({ onLogin }: { onLogin: () => void }) {
    const [users, setUsers] = useState(defaultUsers);
    return (
        <Main>
            <div className={styles.container}>
                <div className={styles.title}>Log in as three people</div>
                <UserList users={users} />
                <div className={styles.loginAction}>
                    <Button title="Log in as everyone" handleClick={onLogin} />
                </div>
            </div>
        </Main>
    );
};