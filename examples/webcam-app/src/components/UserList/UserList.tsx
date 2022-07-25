import { IUser } from "../../interfaces/user";
import { UserCard } from "../UserCard";
import styles from "./UserList.module.scss";

interface IUserList {
    users: IUser[];
}

export function UserList({ users }: IUserList) {
    return (
        <div className={styles.usersList}>
            {users.map(({ name, hashtags }) => <UserCard key={name} name={name} hashtags={hashtags} />)}
        </div>
    );
}