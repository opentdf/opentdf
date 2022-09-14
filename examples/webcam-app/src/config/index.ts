const serverData = window.OIDC_CLIENTID;
export const OIDC_ENDPOINT = "http://localhost:65432";
export const OIDC_REALM = "tdf";
export const OIDC_CLIENT_ID = (serverData != "%REACT_APP_OIDC_CLIENTID%") ? (serverData) : ("examples-webcam-app");
export const KAS_URL = "http://localhost:65432/api/kas";
