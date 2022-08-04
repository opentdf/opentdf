import { useState } from "react";
import { Button } from "../../components/Button";
import { UserList } from "../../components/UserList";
import { Main } from "../Main";
import styles from "./LoginPage.module.scss";

// we should have another userList fetch option 
export const defaultUsers = [
    {
        name: "Alice",
        hashtags: ["paiduser", "adult"]
    },
    {
        name: "Bob",
        hashtags: ["paiduser", "minor"]
    },
    {
        name: "Eve",
        hashtags: ["evesdropper"]
    }
];
export const LoginPage = function LoginPage({ onLogin }: { onLogin: () => void }) {
    const [users, setUsers] = useState(defaultUsers);
    const [disabled, setDisabled] = useState(false);
    const handleLogin = () => {
        onLogin();
        setDisabled(true);
    };
    return (
        <Main>
            <div className={styles.container}>
                <div className={styles.title}>Log in as three people</div>
                <UserList users={users} />
                <div className={styles.loginAction}>
                    <Button disabled={disabled} title="Log in as everyone" handleClick={handleLogin} />
                </div>
            </div>
        </Main>
    );
};