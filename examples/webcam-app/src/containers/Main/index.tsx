import { LoginPage } from "../LoginPage";
import "./Main.scss";

export function Main({ children }: { children: JSX.Element }) {
    return (
        <div className="wrapper">
            <div className="header">Header</div>
            <div className="content">
                {/* <LoginPage /> */}
                {children}
            </div>
            <div className="footer">Bottom</div>
        </div>
    );
}