import { memo } from "react";
import "./Button.scss";

export const Button = memo(function Button({ title, handleClick = () => { } }: { title: string, handleClick?: (event: React.MouseEvent<HTMLElement>) => void | Promise<void>}) {
    return <button className="action-default" onClick={handleClick}>{title}</button>
});