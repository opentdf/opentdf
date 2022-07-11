import React, {useState} from 'react';
import './App.css';
import {AuthProviders, NanoTDFDatasetClient} from "@opentdf/client";
import jwt_decode from "jwt-decode";

const mediaConstraints = {
    audio: false,
    video: true
};

const OIDC_ENDPOINT = "http://localhost:65432";
const OIDC_REALM = "tdf";
const OIDC_CLIENT_ID = "examples-webcam-app";
const KAS_URL = "http://localhost:65432/api/kas";

function App() {
    let isRenderLoop = true;
    const [entitlementsAlice, setEntitlementsAlice] = useState([]);
    const [entitlementsBob, setEntitlementsBob] = useState([]);
    const [entitlementsEve, setEntitlementsEve] = useState([]);
    const [clientAlice, setClientAlice] = useState<NanoTDFDatasetClient>();
    const [clientBob, setClientBob] = useState<NanoTDFDatasetClient>();
    const [clientEve, setClientEve] = useState<NanoTDFDatasetClient>();
    const [clientWebcam, setClientWebcam] = useState<NanoTDFDatasetClient>();
    const [dataAttributes, setDataAttributes] = useState<string[]>([]);

    const stop = () => {
        // @ts-ignore
        window.stream.getTracks().forEach(function(track) {
            if (track.readyState === 'live') {
                track.stop();
            }
        });
        isRenderLoop = false;
    }

    const start = async () => {
        isRenderLoop = true;
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
        const imageDataAlice = contextAlice.createImageData(640, 480);
        function handleSuccess(stream: any) {
            // @ts-ignore
            window.stream = stream; // make stream available to browser console
            // @ts-ignore
            webcamDevice.srcObject = stream;
            // source canvas
            const canvas = document.getElementById('webcamCanvasSource');
            // @ts-ignore
            let ctx = canvas.getContext('2d');
            (async function loop() {
                // source frame
                ctx.drawImage(webcamDevice, 0, 0)
                const imageData = ctx.getImageData(0, 0, 640, 480);
                // encrypt frame
                // tag with data attributes
                clientWebcam && (clientWebcam.dataAttributes = dataAttributes);
                // console.log(imageData.data);
                // FIXME buffer is all 0
                const cipherImageData = await clientWebcam?.encrypt(imageData.data.buffer);
                if (cipherImageData) {
                    // alice decrypt
                    try {
                        const cipherBuffer = await clientAlice?.decrypt(cipherImageData);
                        imageDataAlice.data.set(cipherBuffer);
                        // console.log(imageData);
                        // console.log(imageDataAlice);
                        contextAlice.putImageData(imageData, 0, 0);
                    } catch (e) {
                        console.error(e);
                    }
                    try {
                        const incomingBuffer = await clientBob?.decrypt(cipherImageData);
                        const imageDataBob = contextBob.createImageData(640, 480);
                        imageDataBob.data.set(incomingBuffer);
                        contextBob.putImageData(imageData, 0, 0);
                    } catch (e) {
                    }
                    try {
                        // hack set data attributes
                        clientEve && (clientEve.dataAttributes = dataAttributes);
                        const incomingBuffer = await clientEve?.decrypt(cipherImageData);
                        const imageDataEve = contextEve.createImageData(640, 480);
                        imageDataEve.data.set(incomingBuffer);
                        contextEve.putImageData(imageData, 0, 0);
                    } catch (e) {
                    }
                }
                if (isRenderLoop) {
                    setTimeout(loop, 1000 / 30); // drawing at 30fps
                }
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
        urlencoded.append("password", "myuserpassword");
        urlencoded.append("grant_type", "password");
        let request: Request = new Request("http://localhost:65432/auth/realms/tdf/protocol/openid-connect/token", {method: 'POST', headers: myHeaders, body: urlencoded});
        // alice Direct Access Grants login
        urlencoded.set("username", "alice")
        let response: HttpResponse<any> = await fetch(request);
        let responseJson = await response.json();
        // OpenTDF
        const authProviderAlice = await AuthProviders.refreshAuthProvider({
            clientId: OIDC_CLIENT_ID,
            exchange: 'refresh',
            oidcRefreshToken: responseJson.refresh_token,
            oidcOrigin: OIDC_ENDPOINT,
            organizationName: OIDC_REALM
        });
        // hack
        setClientWebcam(new NanoTDFDatasetClient(authProviderAlice, KAS_URL));
        const tmpClientAlice = new NanoTDFDatasetClient(authProviderAlice, KAS_URL);
        // BEGIN this triggers an OIDC access token with claims to be fetched
        await tmpClientAlice.decrypt(await tmpClientAlice.encrypt("dummy"));
        // END
        // @ts-ignore
        let token = await tmpClientAlice.authProvider.oidcAuth?.getCurrentAccessToken();
        // @ts-ignore
        let decoded: {tdf_claims} = jwt_decode(token);
        setEntitlementsAlice(decoded.tdf_claims.entitlements);
        setClientAlice(tmpClientAlice);
        // bob Direct Access Grants login
        urlencoded.set("username", "bob")
        request = new Request("http://localhost:65432/auth/realms/tdf/protocol/openid-connect/token", {method: 'POST', headers: myHeaders, body: urlencoded});
        response = await fetch(request);
        responseJson = await response.json();
        // bob client
        const authProviderBob = await AuthProviders.refreshAuthProvider({
            clientId: OIDC_CLIENT_ID,
            exchange: 'refresh',
            oidcRefreshToken: responseJson.refresh_token,
            oidcOrigin: OIDC_ENDPOINT,
            organizationName: OIDC_REALM
        });
        const tmpClientBob = new NanoTDFDatasetClient(authProviderBob, KAS_URL);
        // BEGIN this triggers an OIDC access token with claims to be fetched
        await tmpClientBob.decrypt(await tmpClientBob.encrypt("dummy"));
        // END
        // @ts-ignore
        token = await tmpClientBob.authProvider.oidcAuth?.getCurrentAccessToken();
        // @ts-ignore
        decoded = jwt_decode(token);
        setEntitlementsBob(decoded.tdf_claims.entitlements);
        setClientBob(tmpClientBob);
        // eve Direct Access Grants login
        urlencoded.set("username", "eve");
        request = new Request("http://localhost:65432/auth/realms/tdf/protocol/openid-connect/token", {method: 'POST', headers: myHeaders, body: urlencoded});
        response = await fetch(request);
        responseJson = await response.json();
        // eve client
        const authProviderEve = await AuthProviders.refreshAuthProvider({
            clientId: OIDC_CLIENT_ID,
            exchange: 'refresh',
            oidcRefreshToken: responseJson.refresh_token,
            oidcOrigin: OIDC_ENDPOINT,
            organizationName: OIDC_REALM
        });
        const tmpClientEve = new NanoTDFDatasetClient(authProviderEve, KAS_URL);
        // BEGIN this triggers an OIDC access token with claims to be fetched
        await tmpClientEve.decrypt(await tmpClientEve.encrypt("dummy"));
        // END
        // @ts-ignore
        token = await tmpClientEve.authProvider.oidcAuth?.getCurrentAccessToken();
        // @ts-ignore
        decoded = jwt_decode(token);
        setEntitlementsEve(decoded.tdf_claims.entitlements);
        setClientEve(tmpClientEve);
    }

    function toggleContentExclusivity(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
        const premium = "https://example.com/attr/ContentExclusivity/value/Premium";
        if (dataAttributes.includes(premium)) {
            setDataAttributes(dataAttributes.filter(e => { return e !== premium}));
            event.currentTarget.style.borderStyle = '';
        } else {
            dataAttributes.push(premium);
            event.currentTarget.style.borderStyle = 'inset';
        }
    }

    function toggleAudienceGuidance(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
        const restricted = "https://example.com/attr/AudienceGuidance/value/Restricted";
        if (dataAttributes.includes(restricted)) {
            setDataAttributes(dataAttributes.filter(e => { return e !== restricted}));
            event.currentTarget.style.borderStyle = '';
        } else {
            dataAttributes.push(restricted);
            event.currentTarget.style.borderStyle = 'inset';
        }
    }

    // @ts-ignore
    return (
    <div className="App">
        <table>
            <tbody>
            <tr>
                <td><h2>camera</h2><video id="webcamDevice" autoPlay playsInline width="320" height="240"></video></td>
                <td>
                    <button onClick={() => login()}>
                        Login
                    </button>
                    <button onClick={() => start()}>
                        Webcam Start
                    </button>
                    <button onClick={() => stop()}>
                        Webcam Stop
                    </button>
                    <br/><br/>
                    <h2>Video Operator</h2>
                    <b>Data tag</b><br/>
                    ContentExclusivity <button onClick={(event) => toggleContentExclusivity(event)}>Premium</button><br/>
                    AudienceGuidance <button onClick={(event) => toggleAudienceGuidance(event)}>Restricted</button><br/>
                </td>
                <td id="img-src"><h2>Source</h2><canvas id="webcamCanvasSource" width="640" height="480"></canvas></td>
                <td><h2>Entitlement Grantor</h2><a target="_new" href="http://localhost:65432/">Abacus</a><br/><i>ted/myuserpassword</i></td>
            </tr>
            </tbody>
        </table>
        <table>
            <tbody>
            <tr>
                <td>
                    <h2>Alice</h2>Adult - Paid<br/>
                    <canvas id="webcamCanvasAlice" width="640" height="480"></canvas>
                    <EntitlementsList entitlements={entitlementsAlice}/>
                </td>
                <td>
                    <h2>Bob</h2>Minor - Paid<br/>
                    <canvas id="webcamCanvasBob" width="640" height="480"></canvas>
                    <EntitlementsList entitlements={entitlementsBob}/>
                </td>
                <td>
                    <h2>Eve</h2>eavesdropper (authenticated)<br/>
                    <canvas id="webcamCanvasEve" width="640" height="480"></canvas>
                    <EntitlementsList entitlements={entitlementsEve}/>
                </td>
            </tr>
            </tbody>
        </table>
    </div>
  );
}

// @ts-ignore
const EntitlementsList = ({entitlements}) => {
    return <ul>{entitlements.map((entitlement: { entity_identifier: string | null | undefined; entity_attributes: any[]; }) => (
        <li key={entitlement.entity_identifier}>{entitlement.entity_identifier}
            <ul>
                {entitlement.entity_attributes.map(attribute => (
                    <li key={attribute.attribute}>{attribute.attribute}</li>
                ))}
            </ul>
        </li>
    ))}</ul>;
};

interface HttpResponse<T> extends Response {
    parsedBody?: T;
}

export default App;
