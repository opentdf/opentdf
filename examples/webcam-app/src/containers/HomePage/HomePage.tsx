import { useCallback, useRef, useState } from "react";
import { Slider } from "../../components/Slider";
import { UserCard } from "../../components/UserCard";
import { defaultUsers } from "../LoginPage/LoginPage";
import { Main } from "../Main";
import styles from "./HomePage.module.scss";

interface ICameraImage {
    title?: string;
    restricted?: boolean;
}
const CameraImage: React.FC<ICameraImage> = ({ title = "", restricted = false }) => {
    return (
        <div className={styles.cameraContainer}>
            <p>{title}</p>
            <div className={`${styles.cameraImage} ${restricted ? styles.restricted : ""}`}>
                {restricted ? "Restricted" : ""}
                <canvas id="webcamCanvasBob" className={`${styles.canvasContainer} ${restricted ? styles.hidden : ""}`}></canvas>
            </div>
        </div>
    );
}
export function HomePage() {
    const [slider1, setSlider1] = useState(false);
    const onSlider1Change = useCallback((value: boolean) => {
        setSlider1(value);
    }, []);
    const canvas1 = useRef(null);

    return (
        <Main>
            <div className={styles.container}>
                <header><p className={styles.link}><span>Go to ABACUS</span></p></header>
                <div className={styles.settingsPreview}>
                    <video className={styles.cameraContainer} id="webcamDevice" autoPlay playsInline></video>
                    <CameraImage ref={canvas1} title="Datatagged Camera" />
                </div>
                <div className={styles.content}>
                    <div className={styles.settings}>
                        <Slider title="Restricted" onChange={onSlider1Change} />
                        <Slider title="Paid Users" onChange={onSlider1Change} />
                    </div>
                    <div className={styles.userCameraList}>
                        {defaultUsers.map(({ name, hashtags }, index) => (
                            <div key={name} className={styles.userPreview}>
                                <div className={styles.userInfo}>
                                    <UserCard active={index === 0} key={name} name={name} hashtags={hashtags} />
                                </div>
                                <div className={styles.userCamera}>
                                    <CameraImage restricted={index === 2} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Main>
    );
};