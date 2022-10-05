import { NanoTDFDatasetClient } from "@opentdf/client/nano";
import { RefObject, useCallback, useEffect, useRef, useState } from "react";
import { Button } from "../../components/Button";
import { Slider } from "../../components/Slider";
import { UserCard } from "../../components/UserCard";
import { loginUser } from "../../hooks/useLogin";
import { defaultUsers, LoginPage } from "../LoginPage/LoginPage";
import { Main } from "../Main";
import styles from "./HomePage.module.scss";
import { toggleByAttribute } from "./utils";
import { ABACUS_URL } from "../../config";
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

const REFRESH_RATE_CANVAS = 1000 / 24;
const DELAY_FAILURE = 30 * 1000;

const useInterval = (callback: Function, delay?: number | null) => {
    const savedCallback = useRef<Function>(() => {});

    useEffect(() => {
        savedCallback.current = callback;
    });

    useEffect(() => {
        if (delay !== null) {
            const interval = setInterval(() => savedCallback.current(), delay || 0);
            return () => clearInterval(interval);
        }

        return undefined;
    }, [delay]);
};

const useRefreshCanvas = (callBack: any, isActive: boolean) => {
    useInterval(async () => {
        await callBack();
    }, isActive ? REFRESH_RATE_CANVAS : null);
};

const height = 237, width = 221;

export function HomePage() {
    const [isPremium, setPremium] = useState(false);
    const [isRestricted, setRestricted] = useState(false);
    const [authorized, setAuthorized] = useState(false);

    const [clientAlice, setClientAlice] = useState<NanoTDFDatasetClient>();
    const [clientBob, setClientBob] = useState<NanoTDFDatasetClient>();
    const [clientEve, setClientEve] = useState<NanoTDFDatasetClient>();

    const [clientWebcam, setClientWebcam] = useState<NanoTDFDatasetClient>();
    const [dataAttributes, setDataAttributes] = useState<string[]>([]);

    const [streamStarted, setStartStream] = useState<boolean>(false);
    const [streamReset, setStartReset] = useState<boolean>(false);

    const [streamActiveEve, setStreamActiveEve] = useState<boolean>(false);
    const [streamActiveAlice, setStreamActiveAlice] = useState<boolean>(false);
    const [streamActiveBob, setStreamActiveBob] = useState<boolean>(false);

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
        setClientAlice(userAlice.client);

        const userBob = await loginUser("bob", password);
        setClientBob(userBob.client);

        const userEve = await loginUser("eve", password);
        setClientEve(userEve.client);

        setAuthorized(true);
        return {
            clientAlice: userAlice.client,
            clientBob: userBob.client,
            clientEve: userEve.client,
            clientWebcam: userMain.client
        };
    }, [dataAttributes]);

    const canvasRender = useCallback(async (context: CanvasRenderingContext2D, client: NanoTDFDatasetClient) => {
        const ctx = canvas1.current?.getContext('2d');
        const imageData = ctx?.getImageData(0, 0, width, height);
        if (!imageData) {
            throw new Error('Failed getting ImageData');
        }
        const cipherImageData = await clientWebcam?.encrypt(imageData.data.buffer);
        if (!cipherImageData) {
            throw new Error('Failed on encrypt image data');
        }
        const incomingBuffer = await client?.decrypt(cipherImageData);
        const imageDataBob = context.createImageData(width, height);
        //@ts-ignore
        imageDataBob.data.set(incomingBuffer);
        context.putImageData(imageData, 0, 0);
    }, [clientWebcam]);

    useRefreshCanvas(() => {
        const ctx = canvas1.current?.getContext('2d');
        const webcamDevice = videoRef.current;
        // @ts-ignore
        ctx?.drawImage(webcamDevice, 0, 0, width, height);
    }, streamStarted);
    useRefreshCanvas(async () => {
        const contextEve: CanvasRenderingContext2D = refList.current?.[2].getContext('2d')!;
        try {
            //@ts-ignore
            await canvasRender(contextEve, clientEve)
        } catch (err) {
            setStreamActiveEve(false);
            setTimeout(() => {
                setStreamActiveEve( true);
            }, DELAY_FAILURE);
            throw new Error('Failed update canvas');
        }
    }, streamActiveEve);
    useRefreshCanvas(async () => {
        const contextAlice = refList.current?.[0].getContext('2d');
        try {
            //@ts-ignore
            await canvasRender(contextAlice, clientAlice);
        } catch (err) {
            setStreamActiveAlice(false);
            setTimeout(() => setStreamActiveAlice(true), DELAY_FAILURE);
            throw new Error('Failed update canvas');
        }
    }, streamActiveAlice);
    useRefreshCanvas(async () => {
        const contextBob = refList.current?.[1].getContext('2d');
        try {
            //@ts-ignore
            await canvasRender(contextBob, clientBob);
        } catch (err) {
            setStreamActiveBob(false);
            setTimeout(() => setStreamActiveBob(true), DELAY_FAILURE);
            throw new Error('Failed update canvas');
        }
    }, streamActiveBob);

    const start = useCallback(async () => {
        if (refList === null || !streamStarted) return;
        await login();

        // OpenTDF
        navigator.mediaDevices.getUserMedia({ audio: false, video: { width, height }})
            .then((stream: MediaStream) => {
                setStreamActiveAlice(true);
                setStreamActiveBob(true);
                setStreamActiveEve(true); // @ts-ignore
                window.stream = stream; // @ts-ignore make stream available to browser console
                videoRef.current.srcObject = stream;
            })
            .catch((error: { message: any; name: any; }) => {
                console.log('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
            });
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
    }, []);

    useEffect(() => {
        if (streamStarted) {
            start();
        }
    }, [streamStarted, start]);
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
                <header><a href={ABACUS_URL}><p className={styles.link}><span>Go to ABACUS</span></p></a></header>
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