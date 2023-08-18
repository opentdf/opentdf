import { useEffect, useState } from "react";
// @ts-ignore
import { AuthProviders, NanoTDFClient } from "@opentdf/client";
import { useKeycloak } from "@react-keycloak/web";
import { KAS_HOST, KEYCLOAK_CLIENT_ID, KEYCLOAK_HOST } from "../config";

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
      const authProvider = await AuthProviders.refreshAuthProvider({
        clientId: KEYCLOAK_CLIENT_ID,
        exchange: 'refresh',
        oidcOrigin: KEYCLOAK_HOST.replace('/auth', ''),
        refreshToken: data.refresh_token,
      });
      const client = new NanoTDFClient(authProvider, KAS_HOST);
      const clearText = await client.decrypt(data.cypher_text);
      const decoder = new TextDecoder("utf-8");
      const decodedText = decoder.decode(clearText);

      console.log(`decrypted text is: ${decodedText}`);
      setDecryptedText(decodedText);

      return decodedText;
    }
  };

  useEffect(() => {
    decryptString(textToDecrypt);
  }, [textToDecrypt, initialized, keycloak]);

  return { textToDecrypt, setTextToDecrypt, decryptedText, decryptString };
}
