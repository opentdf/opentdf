import React from 'react';
import ReactDOM from 'react-dom';
import './index.scss';
import App from './App';

import Keycloak from "keycloak-js";
import { ReactKeycloakProvider } from "@react-keycloak/web";
import {serverData} from "./configs";
// @ts-ignore
const keycloak = new Keycloak({
    url: serverData.authority,
    clientId: serverData.clientId,
    realm: serverData.realm,
});

ReactDOM.render(
  <React.StrictMode>
      <ReactKeycloakProvider
          authClient={keycloak}
          initOptions={{
              checkLoginIframe: false,
              responseType: "code id_token token",
          }}
          onEvent={(event: unknown, error: unknown) => {
              console.log("onKeycloakEvent", event, error);
          }}
          onTokens={(tokens) => {
              sessionStorage.setItem("keycloak", tokens.token || "");
          }}
      >
          <App />
      </ReactKeycloakProvider>
  </React.StrictMode>,
  document.getElementById('root')
);
