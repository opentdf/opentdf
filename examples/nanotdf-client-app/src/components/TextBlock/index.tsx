import "./TextBlock.scss";
import { useEffect, useState } from "react";
import { AuthProviders, NanoTDFClient } from "@opentdf/client";
import { KAS_BASE_ENDPOINT, OIDC_BASE_ENDPOINT } from "../../configs";
import { type RefreshTokenCredentials } from "@opentdf/client/dist/types/src/nanotdf/types/OIDCCredentials";

interface TextArea {
  text: string;
  updateValue: (value: string) => void;
}
const MyTextArea = ({ text, updateValue }: TextArea) => {
  const [value, setValue] = useState("");

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

  useEffect(() => {
    const oidcCredentials: RefreshTokenCredentials = {
      exchange: "refresh",
      oidcRefreshToken: "FIXME",
      clientId: "tdf-client",
      organizationName: "tdf",
      oidcOrigin: OIDC_BASE_ENDPOINT,
    };
    async function fireThis(): Promise<void> {
      const authProvider = await AuthProviders.refreshAuthProvider(
        oidcCredentials
      );
      console.log(authProvider);
      client = new NanoTDFClient(authProvider, KAS_BASE_ENDPOINT);
    }
    fireThis();
  }, []);

  const encrypt = async () => {
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
