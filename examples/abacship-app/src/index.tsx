import React from "react";
import "core-js/stable";
import "regenerator-runtime/runtime";
import ReactDOM from "react-dom";

//OIDC shenanigans
import { ReactKeycloakProvider } from "@react-keycloak/web";
import Keycloak from "keycloak-js";

import "./index.scss";
import { GameMain } from "./containers/GameMain";
import { RecoilRoot } from "recoil";

//Obviously these would not be hardcoded normally
const KEYCLOAK_HOST = "http://localhost:65432/keycloak/auth/"
const KEYCLOAK_CLIENT_ID = "browsertest"
const KEYCLOAK_REALM = "tdf"

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
    }}
    onEvent={(event, error) => {
      console.log("onKeycloakEvent", event, error);
    }}
    onTokens={(tokens) => {
      sessionStorage.setItem("keycloak", tokens.token || "");
    }}
  >
    <RecoilRoot>
      <GameMain />
    </RecoilRoot>
  </ReactKeycloakProvider>,
  document.getElementById("react-root"),
);
