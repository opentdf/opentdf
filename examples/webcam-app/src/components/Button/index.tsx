import { memo } from "react";
import "./Button.scss";
interface IButton {
    title: string;
    handleClick?: (event: React.MouseEvent<HTMLElement>) => void | Promise<void>;
    disabled?: boolean;
}
export const Button = memo(function Button({ title, handleClick = () => { }, disabled = false }: IButton) {
    return <button disabled={disabled} className="action-default" onClick={handleClick}>{title}</button>
});