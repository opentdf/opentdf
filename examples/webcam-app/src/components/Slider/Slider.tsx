import { FC, useCallback, useState } from "react";
import styles from "./Slider.module.scss";

interface ISlider {
    onChange: (value: boolean) => void;
    title?: string;
}
export const Slider: FC<ISlider> = function Slider({ onChange, title }) {
    const [status, setStatus] = useState(false);
    const onStatusChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const checked = event.target.checked;
        setStatus(checked);
        onChange(checked);
    }, [onChange]);
    return (
        <div className={styles.container}>
            <label htmlFor="slider" className={styles.title}>{title}</label>
            <label className={styles.switch}>
                <input type="checkbox" name="slider" checked={status} onChange={onStatusChange} />
                <span className={`${styles.slider} ${styles.round}`}></span>
            </label>
        </div>
    );
}