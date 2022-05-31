import React from 'react';
import ReactDom from 'react-dom';
import Keycloak from 'keycloak-js';
import { ReactKeycloakProvider } from '@react-keycloak/web';
import App from './App';

import './index.css';

const keycloak = new Keycloak({
  realm: 'tdf',
  url: 'http://localhost:65432/auth/',
  clientId: 'abacus-web',
});

ReactDom.render(
  <ReactKeycloakProvider
    authClient={keycloak}
    initOptions={{
      onLoad: 'login-required',
      checkLoginIframe: false,
      responseType: "code id_token token",
    }}
    onEvent={(event, error) => {
      console.log('onKeycloakEvent', event, error);
    }}
    onTokens={(tokens) => {
      console.log('onTokens', tokens);
      sessionStorage.setItem('keycloak', tokens.token || '');
    }}
  >
    <App />
  </ReactKeycloakProvider>,
document.getElementById('root'));
