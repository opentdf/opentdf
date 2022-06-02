import "./TextBlock.scss";
import { useEffect, useState } from "react";
// @ts-ignore
import { AuthProviders, NanoTDFClient } from "@opentdf/client";
import { serverData } from "../../configs";
import { RefreshTokenCredentials } from "@opentdf/client/dist/types/src/nanotdf/types/OIDCCredentials";
import { useKeycloak } from "@react-keycloak/web";

interface TextArea {
  text: string;
  updateValue: (value: string) => void;
}
const MyTextArea = ({ text, updateValue }: TextArea) => {
  const [value, setValue] = useState("");

  // keycloak authentication
  const { keycloak, initialized } = useKeycloak();

  keycloak.onAuthError = console.log;

  useEffect(() => {
    if (initialized) {
      console.log(keycloak.idToken);
      sessionStorage.setItem("keycloak", keycloak.token || "");
    }
  }, [initialized, keycloak]);

  useEffect(() => {
    setValue(text);
  }, [text]);

  const onChange = (event: { target: { value: string } }) => {
    const targetValue = event.target.value;
    setValue(targetValue);
    updateValue(targetValue);
  };

  return (
    <div>
      <textarea value={value} onChange={onChange} />
    </div>
  );
};

let client: NanoTDFClient;

function TextBlock() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");

  const { keycloak, initialized } = useKeycloak();
  // @ts-ignore
  useEffect(() => {
    const { refreshToken } = keycloak;
    if (!client && refreshToken) {
      const oidcCredentials: RefreshTokenCredentials = {
        clientId: serverData.clientId,
        exchange: "refresh",
        oidcRefreshToken: refreshToken,
        // remove /auth/
        oidcOrigin: serverData.authority.replace("/auth/", ""),
        organizationName: serverData.realm,
      };
      async function fireThis(): Promise<void> {
        const authProvider = await AuthProviders.refreshAuthProvider(
          oidcCredentials
        );
        console.log(authProvider);
        client = new NanoTDFClient(authProvider, serverData.access);
        await client.fetchOIDCToken();
      }
      fireThis();
    }
  }, [initialized, keycloak]);

  const encrypt = async () => {
    console.log(inputText);
    const res = await client.encrypt(inputText);
    const res2 = await client.decrypt(res);
    setOutputText(arrayBufferToString(res2));
  };

  const decrypt = async () => {
    // const res =
    // setInputText(res);
  };

  useEffect(() => {
    // encrypt();
  }, [inputText]);

  return (
    <div className="container">
      <div className="textBlock">
        <MyTextArea text={inputText} updateValue={setInputText} />
        <MyTextArea text={outputText} updateValue={setOutputText} />
      </div>
      <div className="buttons">
        <button onClick={encrypt}>Encrypt</button>
        <button onClick={decrypt}>Decrypt</button>
        {!keycloak.authenticated && (
          <button onClick={() => keycloak.login()}>Log in</button>
        )}
      </div>
    </div>
  );
}

/**
 * Converts an ArrayBuffer to a String.
 *
 * @param buffer - Buffer to convert.
 * @returns String.
 */
export function arrayBufferToString(buffer: ArrayBuffer): string {
  return String.fromCharCode.apply(null, Array.from(new Uint16Array(buffer)));
}

export default TextBlock;
