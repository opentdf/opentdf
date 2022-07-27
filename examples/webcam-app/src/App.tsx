import React from 'react';
import { HomePage } from './containers/HomePage';

function App() {
    return (
        // <div className="App">
        //     <table>
        //         <tbody>
        //         <tr>
        //             <td><h2>camera</h2><video id="webcamDevice" autoPlay playsInline width="320" height="240"></video></td>
        //             <td>
        //                 <button onClick={() => login()}>
        //                     Login
        //                 </button>
        //                 <button onClick={() => start()}>
        //                     Webcam Start
        //                 </button>
        //                 <button onClick={() => stop()}>
        //                     Webcam Stop
        //                 </button>
        //                 <br/><br/>
        //                 <h2>Video Operator</h2>
        //                 <b>Data tag</b><br/>
        //                 ContentExclusivity <button onClick={(event) => toggleContentExclusivity(event)}>Premium</button><br/>
        //                 AudienceGuidance <button onClick={(event) => toggleAudienceGuidance(event)}>Restricted</button><br/>
        //             </td>
        //             <td id="img-src"><h2>Source</h2><canvas id="webcamCanvasSource" width="640" height="480"></canvas></td>
        //             <td><h2>Entitlement Grantor</h2><a target="_new" href="http://localhost:65432/">Abacus</a><br/><i>ted/myuserpassword</i></td>
        //         </tr>
        //         </tbody>
        //     </table>
        //     <table>
        //         <tbody>
        //         <tr>
        //             <td>
        //                 <h2>Alice</h2>Adult - Paid<br/>
        //                 <canvas id="webcamCanvasAlice" width="640" height="480"></canvas>
        //                 <EntitlementsList entitlements={entitlementsAlice}/>
        //             </td>
        //             <td>
        //                 <h2>Bob</h2>Minor - Paid<br/>
        //                 <canvas id="webcamCanvasBob" width="640" height="480"></canvas>
        //                 <EntitlementsList entitlements={entitlementsBob}/>
        //             </td>
        //             <td>
        //                 <h2>Eve</h2>eavesdropper (authenticated)<br/>
        //                 <canvas id="webcamCanvasEve" width="640" height="480"></canvas>
        //                 <EntitlementsList entitlements={entitlementsEve}/>
        //             </td>
        //         </tr>
        //         </tbody>
        //     </table>
        // </div>
        <HomePage />
    );
}

export default App;
