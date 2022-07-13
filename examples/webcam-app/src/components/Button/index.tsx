import { memo } from "react";
import "./Button.scss";

export const Button = memo(function Button({ title }: { title: string }) {
    return <button className="action-default">{title}</button>
});