import { AuthProviders, NanoTDFDatasetClient } from "@opentdf/client";
import jwt_decode from "jwt-decode";
import { useState } from "react";
import { KAS_URL, OIDC_CLIENT_ID, OIDC_ENDPOINT, OIDC_REALM } from "../config";

export interface HttpResponse<T> extends Response {
    parsedBody?: T;
}
const requestToken = async (username: string, password: string) => {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
    const params = {
        client_id: OIDC_CLIENT_ID,
        username,
        password,
        grant_type: "password"
    };
    const urlencoded = new URLSearchParams(params);
    let request: Request = new Request("http://localhost:65432/auth/realms/tdf/protocol/openid-connect/token",
        { method: 'POST', headers: myHeaders, body: urlencoded });
    let response: HttpResponse<unknown> = await fetch(request);
    return response.json();
};
export const loginUser = async (username: string, password: string, attrs?: string[]) => {
    let responseJson = await requestToken(username, password);
    const authProviderEve = await AuthProviders.refreshAuthProvider({
        clientId: OIDC_CLIENT_ID,
        exchange: 'refresh',
        oidcRefreshToken: responseJson.refresh_token,
        oidcOrigin: OIDC_ENDPOINT,
        organizationName: OIDC_REALM
    });
    const tmpClient = new NanoTDFDatasetClient(authProviderEve, KAS_URL);
    if (attrs) {
        tmpClient.dataAttributes = attrs;
    }
    // BEGIN this triggers an OIDC access token with claims to be fetched
    await tmpClient.decrypt(await tmpClient.encrypt("dummy"));
    // END
    // @ts-ignore
    let token = await tmpClient.authProvider.oidcAuth?.getCurrentAccessToken(),
        // @ts-ignore
        decoded: { tdf_claims } = jwt_decode(token);

    return {
        entitlements: decoded.tdf_claims.entitlements,
        client: tmpClient
    };
};

// export const useLogin = async () => {
//     const password = "myuserpassword";
//     const [client, setClient] = useState();
//     const [entitlements, setEntitlements] = useState();

//     // hack
//     // setClientWebcam(new NanoTDFDatasetClient(authProviderAlice, KAS_URL));
//     // const tmpClientAlice = new NanoTDFDatasetClient(authProviderAlice, KAS_URL);
//     let data = await loginUser("alice", password);
//     // setEntitlementsAlice(decoded.tdf_claims.entitlements);
//     // setClientAlice(tmpClientAlice);

//     data = await loginUser("bob", password);
//     // setEntitlementsBob(decoded.tdf_claims.entitlements);
//     // setClientBob(tmpClientBob);

//     data = await loginUser("eve", password);
//     // setEntitlementsEve(data.entitlements);
//     // setClientEve(data.client);
// }
