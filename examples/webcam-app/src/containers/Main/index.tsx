import { LoginPage } from "../LoginPage";
import "./Main.scss";

export function Main() {
    return (
        <div className="wrapper">
            <div className="header">Header</div>
            <div className="content">
                <LoginPage />
            </div>
            <div className="footer">Bottom</div>
        </div>
    );
}