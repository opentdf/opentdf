import React from "react";
import ReactDOM from "react-dom";

//OIDC shenanigans
import { ReactKeycloakProvider } from "@react-keycloak/web";
import Keycloak from "keycloak-js";

import "./index.scss";
import { GameMain } from "./containers/GameMain";
import { RecoilRoot } from "recoil";
import { KEYCLOAK_CLIENT_ID, KEYCLOAK_HOST, KEYCLOAK_REALM } from "./config";

// @ts-ignore
const keycloak = new Keycloak({
  url: KEYCLOAK_HOST,
  clientId: KEYCLOAK_CLIENT_ID,
  realm: KEYCLOAK_REALM,
});

ReactDOM.render(
  <ReactKeycloakProvider
    authClient={keycloak}
    initOptions={{
      onLoad: 'login-required',
      responseType: "code id_token token",
      pkceMethod: "S256"
    }}
    onEvent={(event, error) => {
      console.log("onKeycloakEvent", event, error);
    }}
    onTokens={(tokens) => {
      sessionStorage.setItem("token", tokens.token || "");
      sessionStorage.setItem("refreshToken", tokens.refreshToken || "");
    }}
  >
    <RecoilRoot>
      <GameMain />
    </RecoilRoot>
  </ReactKeycloakProvider>,
  document.getElementById("react-root"),
);
