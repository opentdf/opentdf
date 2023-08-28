import React from "react";
import ReactDOM from "react-dom/client";
import Keycloak from 'keycloak-js';
import { ReactKeycloakProvider } from '@react-keycloak/web';
import App from "./App";
import "./index.css";

const keycloak = new Keycloak({
  realm: 'tdf',
  url: 'http://localhost:65432/auth/',
  clientId: 'todo-react-client',
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ReactKeycloakProvider
      authClient={keycloak}
      initOptions={{
        checkLoginIframe: false,
        responseType: "code id_token token",
        pkceMethod: "S256"
      }}
    >
      <App />
    </ReactKeycloakProvider>
  </React.StrictMode>
);
