import './TextBlock.scss';
import {useEffect, useState} from "react";
// @ts-ignore
import {NanoTDFClient} from "@opentdf/client";
import {KAS_BASE_ENDPOINT, OIDC_BASE_ENDPOINT} from "../../configs";


interface TextArea {
    text: string
    updateValue: (value:string) => void
}
const TextArea =({text, updateValue}:TextArea) => {
    const [value, setValue] = useState('');

    useEffect(()=>{
        setValue(text);
    },[text]);

    const onChange = (event: { target: { value: string; }; }) => {
        const value = event.target.value;
        setValue(value);
        updateValue(value);
    };

    return (
        <div>
            <textarea value={value} onChange={onChange}/>
        </div>
    );
};

function TextBlock() {
    const [inputText, setInputText] = useState('');
    const [outputText, setOutputText] = useState('');
    const [client, setClient] = useState({encrypt:(val:string)=>'', decrypt:(val:string)=>''});

    // @ts-ignore
    useEffect(async ()=>{
        // @ts-ignore
        const client = new NanoTDFClient.default(
            {
                clientId: 'tdf-client',
                clientSecret: '123-456',
                organizationName: 'tdf',
                oidcOrigin: OIDC_BASE_ENDPOINT,
                exchange: 'client'
            },
            KAS_BASE_ENDPOINT
        );
        setClient(client);
    },[]);

    const encrypt = async ()=> {
        const res = await client.encrypt(inputText);
        const res2 =  await client.decrypt(res);
        setOutputText(res);
    };

    const decrypt = async ()=> {
        // const res =
        // setInputText(res);
    };

    useEffect(() => {
        // encrypt();
    }, [inputText]);


    return (
        <div className="container">
            <div className="textBlock">
                <TextArea text={inputText} updateValue={setInputText}/>
                <TextArea text={outputText} updateValue={setOutputText}/>
            </div>
            <div className="buttons">
                <button onClick={encrypt}>Encrypt</button>
                <button onClick={decrypt}>Decrypt</button>
            </div>
        </div>
    );
}

export default TextBlock;
