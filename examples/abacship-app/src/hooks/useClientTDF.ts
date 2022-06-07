import { useEffect, useState } from "react";
// @ts-ignore
import { AuthProviders, Client, NanoTDFClient } from "@opentdf/client";
import { useKeycloak } from "@react-keycloak/web";
import { KAS_HOST, KEYCLOAK_CLIENT_ID, KEYCLOAK_HOST, KEYCLOAK_REALM } from "../config";
import { RefreshTokenCredentials } from "@opentdf/client/dist/types/src/auth/OIDCCredentials";

interface ICypherTextInfo {
  cypher_text: string; // BASE 64 encoded string
  access_token: string;
  refresh_token: string;
}

export function useClientTDF() {
  const [textToDecrypt, setTextToDecrypt] = useState<ICypherTextInfo>({
    cypher_text: "",
    access_token: "",
    refresh_token: ""
  });
  const [decryptedText, setDecryptedText] = useState<string>("");
  const { keycloak, initialized } = useKeycloak();
  const decryptString = async (data: ICypherTextInfo) => {
    if (data?.cypher_text) {
      const oidcCredentials: RefreshTokenCredentials = {
        clientId: KEYCLOAK_CLIENT_ID,
        exchange: 'refresh',
        oidcRefreshToken: data.refresh_token,
        oidcOrigin: KEYCLOAK_HOST.replace('/auth', ''),
        organizationName: KEYCLOAK_REALM
      }
      const authProvider = await AuthProviders.refreshAuthProvider(oidcCredentials);
      const client = new NanoTDFClient(authProvider, KAS_HOST);
      const clearText = await client.decrypt(data.cypher_text);
      const decoder = new TextDecoder("utf-8");
      const decodedText = decoder.decode(clearText);

      console.log(`decrypted text is: ${decodedText}`);
      setDecryptedText(decodedText);
    }
  };

  useEffect(() => {
    decryptString(textToDecrypt);
  }, [textToDecrypt, initialized, keycloak]);

  return { textToDecrypt, setTextToDecrypt, decryptedText };
}
