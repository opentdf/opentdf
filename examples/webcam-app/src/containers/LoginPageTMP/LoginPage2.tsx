import { memo } from "react";
import { Button } from "../../components/Button";
import "./LoginPage.scss";

export const LoginPage = memo(function LoginPage() {
    return (
        <div className="loginPage">
            <div className="title">Login as each person...</div>
            <div className="buttons-group">
                <div>
                    <Button title="Login at Alice" />
                    <p className="status">Logged in!</p>
                </div>
                <div>
                    <Button title="Login at Bob" />
                    <p className="status">Logged in!</p>
                </div>
                <div>
                    <Button title="Login at Job" />
                    <p className="status">Logged in!</p>
                </div>
            </div>
        </div>
    );
});