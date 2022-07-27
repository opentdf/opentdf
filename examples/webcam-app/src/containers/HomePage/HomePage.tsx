import { NanoTDFDatasetClient } from "@opentdf/client";
import { RefObject, useCallback, useRef, useState } from "react";
import { Button } from "../../components/Button";
import { Slider } from "../../components/Slider";
import { UserCard } from "../../components/UserCard";
import { loginUser } from "../../hooks/useLogin";
import { defaultUsers, LoginPage } from "../LoginPage/LoginPage";
import { Main } from "../Main";
import styles from "./HomePage.module.scss";
interface ICameraImage {
    title?: string;
    restricted?: boolean;
    forwardedRef: RefObject<HTMLCanvasElement> | undefined | any;
}
const CameraImage: React.FC<ICameraImage> = ({ title = "", restricted = false, forwardedRef }) => {
    return (
        <div className={styles.cameraContainer}>
            <p>{title}</p>
            <div className={`${styles.cameraImage} ${restricted ? styles.restricted : ""}`}>
                {restricted ? "Restricted" : ""}
                <canvas
                    ref={forwardedRef}
                    className={`${styles.canvasContainer} ${restricted ? styles.hidden : ""}`}
                    width="221" height="237"></canvas>
            </div>
        </div>
    );
}
export function HomePage() {
    const [slider1, setSlider1] = useState(false);
    const [authorized, setAuthorized] = useState(false);
    let isRenderLoop = true;
    // const [entitlementsAlice, setEntitlementsAlice] = useState([]);
    // const [entitlementsBob, setEntitlementsBob] = useState([]);
    // const [entitlementsEve, setEntitlementsEve] = useState([]);
    const [clientAlice, setClientAlice] = useState<NanoTDFDatasetClient>();
    const [clientBob, setClientBob] = useState<NanoTDFDatasetClient>();
    const [clientEve, setClientEve] = useState<NanoTDFDatasetClient>();
    const [clientWebcam, setClientWebcam] = useState<NanoTDFDatasetClient>();
    const [dataAttributes, setDataAttributes] = useState<string[]>([]);

    const onSlider1Change = useCallback((value: boolean) => {
        setSlider1(value);
    }, []);
    const canvas1 = useRef<HTMLCanvasElement>(null);
    const refList = useRef<HTMLCanvasElement[]>([]);
    const videoRef = useRef<HTMLVideoElement>(null);

    console.log(refList?.current[0]?.getContext('2d'));

    const login = async () => {
        const password = "myuserpassword";
        // hack
        const userAlice = await loginUser("alice", password);
        setClientWebcam(userAlice.client);
        // setEntitlementsAlice(userAlice.entitlements);
        setClientAlice(userAlice.client);

        const userBob = await loginUser("bob", password);
        // setEntitlementsBob(userBob.entitlements);
        setClientBob(userBob.client);

        const userEve = await loginUser("eve", password);
        // setEntitlementsEve(userEve.entitlements);
        setClientEve(userEve.client);

        setAuthorized(true);
    }

    const stop = () => {
        // @ts-ignore
        window.stream.getTracks().forEach(function (track) {
            if (track.readyState === 'live') {
                track.stop();
            }
        });
        isRenderLoop = false;
    }

    const start = async () => {
        if (refList === null) return;
        const height = 237,
            width = 221;

        isRenderLoop = true;
        const webcamDevice = videoRef.current;

        const canvasElementAlice = refList.current?.[0];
        const canvasElementBob = refList.current?.[1];
        const canvasElementEve = refList.current?.[2];
        // @ts-ignore
        const contextAlice = canvasElementAlice.getContext('2d');
        // @ts-ignore
        let contextBob = canvasElementBob.getContext('2d');
        // @ts-ignore
        let contextEve = canvasElementEve.getContext('2d');
        // handle aspect ratio 
        // var heightRatio = (canvasRef.width / videoRef.width) * videoRef.height;
        // ctx.drawImage(webcamDevice, 0, 0, c.width, hRatio); // add Y center 
        // OpenTDF
        function handleSuccess(stream: any) {
            // @ts-ignore
            window.stream = stream; // make stream available to browser console
            // @ts-ignore
            webcamDevice.srcObject = stream;
            // source canvas
            const canvas = canvas1.current;
            // @ts-ignore
            let ctx = canvas.getContext('2d');
            (async function loop() {
                // source frame
                // @ts-ignore
                ctx?.drawImage(webcamDevice, 0, 0, width, height);
                const imageData = ctx?.getImageData(0, 0, width, height);
                // encrypt frame
                // tag with data attributes
                clientWebcam && (clientWebcam.dataAttributes = dataAttributes);
                // FIXME buffer is all 0
                // @ts-ignore
                const cipherImageData = await clientWebcam?.encrypt(imageData.data.buffer);
                const updateCanvas = async (canvasContext: CanvasRenderingContext2D | null, client: NanoTDFDatasetClient | undefined, imageDataEncrypted: ArrayBuffer) => {
                    try {
                        const incomingBuffer = await client?.decrypt(imageDataEncrypted);
                        const imageDataBob = canvasContext?.createImageData(width, height);
                        // @ts-ignore
                        imageDataBob?.data.set(incomingBuffer);
                        // @ts-ignore
                        canvasContext?.putImageData(imageData, 0, 0);
                    } catch (e) {
                        console.error(e);
                    }
                };
                if (cipherImageData) {
                    updateCanvas(contextAlice, clientAlice, cipherImageData);
                    updateCanvas(contextBob, clientBob, cipherImageData);
                    updateCanvas(contextEve, clientEve, cipherImageData);
                }
                if (isRenderLoop) {
                    setTimeout(loop, 1000 / 30); // drawing at 30fps
                }
            })();
        }

        function handleError(error: { message: any; name: any; }) {
            console.log('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
        }

        const mediaConstraints = {
            audio: false,
            video: { width: 221, height: 237 }
        };
        navigator.mediaDevices.getUserMedia(mediaConstraints).then(handleSuccess).catch(handleError);
    }

    if (!authorized) {
        return (<LoginPage onLogin={login} />);
    }

    return (
        <Main>
            <div className={styles.container}>
                <header><p className={styles.link}><span>Go to ABACUS</span></p></header>
                <div className={styles.settingsPreview}>
                    <div className={styles.cameraContainer}>
                        <p>Camera</p>
                        <div className={styles.cameraWrapper}><video width="221" height="237" ref={videoRef} autoPlay playsInline></video></div>
                        <div className={styles.cameraButton}><Button title="Start" handleClick={start} /></div>
                    </div>
                    <div>
                        <CameraImage forwardedRef={canvas1} title="Datatagged Camera" />
                        <div className={styles.cameraButton}><Button title="Stop" handleClick={stop} /></div>
                    </div>
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
                                    <CameraImage restricted={index === 2} forwardedRef={(ref: any) => (refList.current[index] = ref)} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Main>
    );
};