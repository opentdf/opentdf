import { NanoTDFDatasetClient } from "@opentdf/client";
import { RefObject, useCallback, useEffect, useRef, useState } from "react";
import { Button } from "../../components/Button";
import { Slider } from "../../components/Slider";
import { UserCard } from "../../components/UserCard";
import { loginUser } from "../../hooks/useLogin";
import { defaultUsers, LoginPage } from "../LoginPage/LoginPage";
import { Main } from "../Main";
import styles from "./HomePage.module.scss";
import { toggleByAttribute } from "./utils";
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
let isRenderLoop = true;
export function HomePage() {
    const [isPremium, setPremium] = useState(false);
    const [isRestricted, setRestricted] = useState(false);
    const [authorized, setAuthorized] = useState(false);
    // const [entitlementsAlice, setEntitlementsAlice] = useState([]);
    // const [entitlementsBob, setEntitlementsBob] = useState([]);
    // const [entitlementsEve, setEntitlementsEve] = useState([]);
    const [clientAlice, setClientAlice] = useState<NanoTDFDatasetClient>();
    const [clientBob, setClientBob] = useState<NanoTDFDatasetClient>();
    const [clientEve, setClientEve] = useState<NanoTDFDatasetClient>();
    const [clientWebcam, setClientWebcam] = useState<NanoTDFDatasetClient>();
    const [dataAttributes, setDataAttributes] = useState<string[]>([]);
    const [streamStarted, setStartStream] = useState<boolean>(false);
    const [streamReset, setStartReset] = useState<boolean>(false);

    const resetStream = useCallback(() => {
        if (streamStarted) {
            setStartReset(true);
            setStartStream(false);
        }
    }, [streamStarted]);
    const onRestrictedChange = useCallback((value: boolean) => {
        const restricted = "https://example.com/attr/AudienceGuidance/value/Restricted";
        setRestricted(value);
        toggleByAttribute(restricted, dataAttributes, setDataAttributes);
        resetStream();
    }, [dataAttributes, resetStream]);
    const onPremiumChange = useCallback((value: boolean) => {
        const premium = "https://example.com/attr/ContentExclusivity/value/Premium";
        setPremium(value);
        toggleByAttribute(premium, dataAttributes, setDataAttributes);
        resetStream();
    }, [dataAttributes, resetStream]);
    const canvas1 = useRef<HTMLCanvasElement>(null);
    const refList = useRef<HTMLCanvasElement[]>([]);
    const videoRef = useRef<HTMLVideoElement>(null);

    const login = useCallback(async () => {
        const password = "myuserpassword";
        const userAlice = await loginUser("alice", password, dataAttributes);
        setClientWebcam(userAlice.client);
        const userMain = await loginUser("alice", password, dataAttributes);
        // setEntitlementsAlice(userAlice.entitlements);
        setClientAlice(userAlice.client);

        const userBob = await loginUser("bob", password);
        // setEntitlementsBob(userBob.entitlements);
        setClientBob(userBob.client);

        const userEve = await loginUser("eve", password);
        // setEntitlementsEve(userEve.entitlements);
        setClientEve(userEve.client);

        setAuthorized(true);
        return {
            clientAlice: userAlice.client,
            clientBob: userBob.client,
            clientEve: userEve.client,
            clientWebcam: userMain.client
        };
    }, [dataAttributes]);

    const start = useCallback(async () => {
        if (refList === null || !streamStarted) return;
        const { clientAlice, clientBob, clientEve, clientWebcam } = await login();
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
                        // console.error(e);
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
            video: { width, height }
        };
        navigator.mediaDevices.getUserMedia(mediaConstraints).then(handleSuccess).catch(handleError);
    }, [login, streamStarted]);
    const startStream = useCallback(() => {
        setStartStream(true);
    }, []);
    const stopStream = useCallback(() => {
        setStartStream(false);
        // @ts-ignore
        window.stream.getTracks().forEach(function (track) {
            if (track.readyState === 'live') {
                track.stop();
            }
        });
        isRenderLoop = false;
    }, []);

    useEffect(() => {
        if (streamStarted) {
            start();
        }
    }, [streamStarted]);

    useEffect(() => {
        if (streamReset) {
            stopStream();
            setStartReset(false);
            setStartStream(true);
        }
    }, [stopStream, streamReset]);

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
                        <div className={styles.cameraButton}><Button title="Start" handleClick={startStream} /></div>
                    </div>
                    <div>
                        <CameraImage forwardedRef={canvas1} title="Datatagged Camera" />
                        <div className={styles.cameraButton}><Button title="Stop" handleClick={stopStream} /></div>
                    </div>
                </div>
                <div className={styles.content}>
                    <div className={styles.settings}>
                        <Slider title="Restricted" onChange={onRestrictedChange} />
                        <Slider title="Paid Users" onChange={onPremiumChange} />
                    </div>
                    <div className={styles.userCameraList}>
                        {defaultUsers.map(({ name, hashtags }, index) => (
                            <div key={name} className={styles.userPreview}>
                                <div className={styles.userInfo}>
                                    <UserCard active={index === 0} key={name} name={name} hashtags={hashtags} />
                                </div>
                                <div className={styles.userCamera}>
                                    <CameraImage restricted={((name === "Bob" || name === "Eve") && (isRestricted)) || (name === "Eve" && isPremium)} forwardedRef={(ref: any) => (refList.current[index] = ref)} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Main>
    );
};