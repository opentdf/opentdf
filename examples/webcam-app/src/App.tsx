import React from 'react';
import './App.css';
import {AuthProviders, NanoTDFDatasetClient} from "@opentdf/client";

const mediaConstraints = {
    audio: false,
    video: true
};

const OIDC_ENDPOINT = "http://localhost:65432";
const OIDC_REALM = "tdf";
const OIDC_CLIENT_ID = "localhost-webcam-app";
const KAS_URL = "http://localhost:65432/api/kas";

function App() {
    let refreshTokenAlice = "";
    let refreshTokenBob = "";
    let refreshTokenEve = "";
    let dataAttributes: string[] = [];

    const start = async () => {
        const webcamDevice = document.getElementById('webcamDevice');
        const canvasElementAlice = document.getElementById('webcamCanvasAlice');
        const canvasElementBob = document.getElementById('webcamCanvasBob');
        const canvasElementEve = document.getElementById('webcamCanvasEve');
        // @ts-ignore
        const contextAlice = canvasElementAlice.getContext('2d');
        // @ts-ignore
        let contextBob = canvasElementBob.getContext('2d');
        // @ts-ignore
        let contextEve = canvasElementEve.getContext('2d');
        // OpenTDF
        const authProvider = await AuthProviders.refreshAuthProvider({
            clientId: OIDC_CLIENT_ID,
            exchange: 'refresh',
            oidcRefreshToken: refreshTokenAlice,
            oidcOrigin: OIDC_ENDPOINT,
            organizationName: OIDC_REALM
        });
        const clientWebcam = new NanoTDFDatasetClient(authProvider, KAS_URL);
        // alice client
        const clientAlice = new NanoTDFDatasetClient(authProvider, KAS_URL);
        const imageDataAlice = contextAlice.createImageData(640, 480);
        // bob client
        const authProviderBob = await AuthProviders.refreshAuthProvider({
            clientId: OIDC_CLIENT_ID,
            exchange: 'refresh',
            oidcRefreshToken: refreshTokenBob,
            oidcOrigin: OIDC_ENDPOINT,
            organizationName: OIDC_REALM
        });
        const clientBob = new NanoTDFDatasetClient(authProviderBob, KAS_URL);
        // eve client
        const authProviderEve = await AuthProviders.refreshAuthProvider({
            clientId: OIDC_CLIENT_ID,
            exchange: 'refresh',
            oidcRefreshToken: refreshTokenEve,
            oidcOrigin: OIDC_ENDPOINT,
            organizationName: OIDC_REALM
        });
        const clientEve = new NanoTDFDatasetClient(authProviderEve, KAS_URL);
        function handleSuccess(stream: any) {
            // @ts-ignore
            window.stream = stream; // make stream available to browser console
            // @ts-ignore
            webcamDevice.srcObject = stream;
            // nano data client
            // source canvas
            const canvas = document.getElementById('webcamCanvasSource');
            // @ts-ignore
            let ctx = canvas.getContext('2d');
            (async function loop() {
                // source frame
                ctx.drawImage(webcamDevice, 0, 0)
                const imageData = ctx.getImageData(0, 0, 640, 480);
                // encrypt frame
                clientWebcam.dataAttributes = dataAttributes;
                // console.log(imageData.data);
                // FIXME buffer is all 0
                const cipherImageData = await clientWebcam.encrypt(imageData.data.buffer);
                // alice decrypt
                try {
                    const cipherBuffer = await clientAlice.decrypt(cipherImageData);
                    // console.log(cipherBuffer);
                    imageDataAlice.data.set(cipherBuffer);
                    // console.log(imageData);
                    // console.log(imageDataAlice);
                    contextAlice.putImageData(imageData, 0, 0);
                } catch (e) {
                    console.error(e);
                }
                try {
                    const incomingBuffer = await clientBob.decrypt(cipherImageData);
                    const imageDataBob = contextBob.createImageData(640, 480);
                    imageDataBob.data.set(incomingBuffer);
                    contextBob.putImageData(imageData, 0, 0);
                } catch (e) {
                }
                try {
                    const incomingBuffer = await clientEve.decrypt(cipherImageData);
                    const imageDataEve = contextEve.createImageData(640, 480);
                    imageDataEve.data.set(incomingBuffer);
                    contextEve.putImageData(imageData, 0, 0);
                } catch (e) {
                }
                setTimeout(loop, 1000 / 30); // drawing at 30fps
            })();
        }

        function handleError(error: { message: any; name: any; }) {
            console.log('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
        }

        navigator.mediaDevices.getUserMedia(mediaConstraints).then(handleSuccess).catch(handleError);
    }


    const login = async () => {

        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/x-www-form-urlencoded");

        const urlencoded = new URLSearchParams();
        urlencoded.append("client_id", OIDC_CLIENT_ID);
        urlencoded.append("username", "alice");
        urlencoded.append("password", "testuser123");
        urlencoded.append("grant_type", "password");

        const requestOptions = {
            method: 'POST',
            headers: myHeaders,
            body: urlencoded,
            redirect: 'follow'
        };
        // alice Direct Access Grants login
        urlencoded.set("username", "alice")
        // @ts-ignore
        fetch("http://localhost:65432/auth/realms/tdf/protocol/openid-connect/token", requestOptions)
            .then(response => response.json())
            .then(result => {
                refreshTokenAlice = result.refresh_token;
            })
            .catch(error => console.log('error', error));
        // bob Direct Access Grants login
        urlencoded.set("username", "bob")
        // @ts-ignore
        fetch("http://localhost:65432/auth/realms/tdf/protocol/openid-connect/token", requestOptions)
            .then(response => response.json())
            .then(result => {
                refreshTokenBob = result.refresh_token;
            })
            .catch(error => console.log('error', error));
        // eve Direct Access Grants login
        urlencoded.set("username", "eve")
        // @ts-ignore
        fetch("http://localhost:65432/auth/realms/tdf/protocol/openid-connect/token", requestOptions)
            .then(response => response.json())
            .then(result => {
                refreshTokenEve = result.refresh_token;
            })
            .catch(error => console.log('error', error));
    }

    function toggleContentExclusivity(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
        const premier = "https://opentdf.us/attr/X-ContentExclusivity/value/Premier";
        if (dataAttributes.includes(premier)) {
            dataAttributes = dataAttributes.filter(e => { return e !== premier})
            event.currentTarget.style.borderStyle = '';
        } else {
            dataAttributes.push(premier)
            event.currentTarget.style.borderStyle = 'inset';
        }
    }

    function toggleAudienceGuidance(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
        const restricted = "https://opentdf.us/attr/X-AudienceGuidance/value/Restricted";
        if (dataAttributes.includes(restricted)) {
            dataAttributes = dataAttributes.filter(e => { return e !== restricted})
            event.currentTarget.style.borderStyle = '';
        } else {
            dataAttributes.push(restricted);
            event.currentTarget.style.borderStyle = 'inset';
        }
    }

    return (
    <div className="App">
        <table>
            <tbody>
            <tr>
                <td><video id="webcamDevice" autoPlay playsInline width="320" height="240"></video></td>
                <td>
                    <button
                        onClick={() => login()}
                    >
                        Login
                    </button>
                    <button
                        onClick={() => start()}
                    >
                        Webcam
                    </button>
                    <br/><br/>
                    <h2>Video Operator</h2>
                    <h4>Data tag</h4>
                    ContentExclusivity <button onClick={(event) => toggleContentExclusivity(event)}>Premier</button><br/>
                    AudienceGuidance <button onClick={(event) => toggleAudienceGuidance(event)}>Restricted</button><br/>
                </td>
                <td><canvas id="webcamCanvasSource" width="640" height="480"></canvas><h2>Source</h2></td>
                <td><h2>Entitlement Grantor</h2><a target="_new" href="http://localhost:65432/">Abacus</a><br/><i>user1/testuser123</i></td>
            </tr>
            </tbody>
        </table>
        <table>
            <tbody>
            <tr>
                <td><h2>Alice</h2>Adult - Paid<br/><canvas id="webcamCanvasAlice" width="640" height="480"></canvas></td>
                <td><h2>Bob</h2>Minor - Paid<br/><canvas id="webcamCanvasBob" width="640" height="480"></canvas></td>
                <td><h2>Eve</h2>eavesdropper (authenticated)<br/><canvas id="webcamCanvasEve" width="640" height="480"></canvas></td>
            </tr>
            </tbody>
        </table>
    </div>
  );
}

export default App;
