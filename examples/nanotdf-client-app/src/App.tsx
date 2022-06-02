import "./App.scss";
import TextBlock from "./components/TextBlock";
import Keycloak from "keycloak-js";
import { ReactKeycloakProvider } from "@react-keycloak/web";
import { serverData } from "./configs";

// @ts-ignore
const keycloak = new Keycloak({
  url: serverData.authority,
  clientId: serverData.clientId,
  realm: serverData.realm,
});

export function App() {
  return (
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
      <div className="App">
        <h1>NanoTDF Example</h1>
        <TextBlock />
      </div>
    </ReactKeycloakProvider>
  );
}
