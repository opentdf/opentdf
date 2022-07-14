import React, { useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { useKeycloak } from '@react-keycloak/web';
import { Client, FileClient } from '@opentdf/client';
import { Button, Divider, Input, Layout, Select, Space, Spin, Table, Tooltip, Typography, Upload } from 'antd';
import { ToolOutlined } from '@ant-design/icons';
import { PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { toWebReadableStream } from "web-streams-node";
import fileReaderStream from 'filereader-stream';
import UserStatus from "./components/UserStatus";
import openTDFLogo from './assets/images/period-logo.png';
import './App.css';
import FullCalendar from '@fullcalendar/react' 
import dayGridPlugin from '@fullcalendar/daygrid'
import jwt_decode from "jwt-decode"
import { Checkbox, CheckboxGroup } from 'rsuite';

import { Readable } from 'stream'

import { validateJsonStr } from './utils';

const { Header, Footer, Content } = Layout;
const { TextArea } = Input;

const s3ConfigJson = `
{
  "Bucket": "hackathon-period",
  "credentials": {
    "accessKeyId": "fakekeyid",
    "secretAccessKey": "fakeaccesskey"
  },
  "region": "us-east-2",
  "signatureVersion": "v4",
  "s3ForcePathStyle": true
}
`
const CycleInfo = () => {

}

const attributePrefix = "http://period.com/attr/tracker/value/"


const App = () => {
  const { keycloak, initialized } = useKeycloak();
  const [opentdfClient, setOpentdfClient] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedS3Config, setSelectedS3Config] = useState();
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [s3Config, setS3Config] = useState('');
  const [showUploadSpinner, setShowUploadSpinner] = useState(false);
  const [showDownloadSpinner, setShowDownloadSpinner] = useState(false);
  const [uploadFileList, setUploadFileList] = useState([]);
  const [savedS3Configs, setSavedS3Configs] = useState([]);
  const [newS3Name, setNewS3Name] = useState('');

  const CLIENT_CONFIG = { // TODO: set this as env vars .etc
    clientId: keycloak.clientId,
    organizationName: keycloak.realm,
    exchange: 'refresh',
    oidcOrigin: keycloak.authServerUrl,
    oidcRefreshToken: keycloak.refreshToken,
    kasEndpoint: 'http://localhost:65432/api/kas',
  };

  const events = [{ title: "today's event", date: new Date() }];

  keycloak.onAuthError = console.log;

  const handleFileSelect = (file, fileList) => {
    setSelectedFile(file);
    setUploadFileList(fileList);
    return false;
  }


  const handleTextBoxChange = async (e) => {
    await setS3Config(e.target.value);
  }

  const handleNewS3ConfigName = async (e) => {
    await setNewS3Name(e.target.value);
  };

  const handleS3ConfigSelect = (selectedKey, option) => {
    const selectedOption = savedS3Configs.find(({key}) => key === parseInt(selectedKey));
    setS3Config(selectedOption.data);
  };

  const handleSaveS3Config = async (e) => {
    e.preventDefault();

    if(!keycloak.authenticated) {
      toast.error('You must login to perform this action.');
      return;
    }


    // Checks for falsey values, empty valid objects, and invalid objects
    if(!s3ConfigJson) {
      toast.error('Please enter a valid S3 compatible json object.');
      return;
    }

    await setSavedS3Configs([...savedS3Configs, {name: newS3Name, data: s3Config, key: savedS3Configs.length + 1}])
    await setNewS3Name('');
  };

  // const getKeycloakUserId = async () => {
  //   let users = "";
  //   let auth = ""
  //   let decoded = jwt_decode(keycloak.token);
  //   let username = decoded[sub];
  //   // i think we need a specific user with the view-users role to 
  //   let post_data={"grant_type": "password", "username": "keycloakadmin", "password": "mykeycloakpassword", "client_id":"admin-cli"}
  //   $.ajax({ 
  //     type : "POST", 
  //     url : keycloak.authServerUrl+"/auth/realms/master/protocol/openid-connect/token", 
  //     data : post_data,
  //     success : function(result) { 
  //         auth = $.parseJSON(result);
  //     }, 
  //     error : function(result) { 
  //       var json = $.parseJSON(data);
  //       console.log(json);
  //     } 
  //   });
  //   $.ajax({ 
  //     type : "GET", 
  //     url : keycloak.authServerUrl+"/admin/realms/tdf/users", 
  //     beforeSend: function(xhr){xhr.setRequestHeader('Authorization', 'Bearer '+auth["access_token"]);},
  //     success : function(result) { 
  //         users = $.parseJSON(result);
  //     }, 
  //     error : function(result) { 
  //       var json = $.parseJSON(data);
  //       console.log(json);
  //     } 
  //   });
  //   let id = null;
  //   for (const u of users){
  //     if (u["username"]==username){
  //       id = u["id"]
  //       return id;
  //     }
  //   }
  //   return id;
  // };

  const lfsDownload = async (text, record, index) => {

    if(!keycloak.authenticated) {
      toast.error('You must login to perform this action.');
      return;
    }

    // const keycloak_id = getKeycloakUserId()
    //   if (!keycloak_id) {
    //     toast.error('Keycloak user not found');
    //     return;
    //   }

    const fileToDecryptName = keycloak_id+".tdf";

    console.log("record: ", record)
    console.log("txt: ", text)

    try {
      setShowDownloadSpinner(true);

      const decryptParams = await new Client.DecryptParamsBuilder().setRemoteStore(
        fileToDecryptName,
        s3ConfigJson
      );

      const decryptedFileName = `${fileToDecryptName}.decrypted`;

      const client = new Client.Client(CLIENT_CONFIG);

      let plainTextStream = await client.decrypt(decryptParams);

      function streamToString (stream) {
        const chunks = [];
        return new Promise((resolve, reject) => {
          stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
          stream.on('error', (err) => reject(err));
          stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
        })
      }
      
      const result = await streamToString(plainTextStream)

      // plainTextStream
      //   .toFile(decryptedFileName)
      //   .then(() => {
      //     setShowDownloadSpinner(false);
      //   });
      setShowDownloadSpinner(false)

    } catch (e) {
      setShowDownloadSpinner(false);
      console.error(e);
    }
  };

  const lfsUpload = async () => {
    try {
      if(!keycloak.authenticated) {
        toast.error('You must login to perform this action.');
        return;
      }

      setShowUploadSpinner(true);

      // const keycloak_id = getKeycloakUserId()
      // if (!keycloak_id) {
      //   toast.error('Keycloak user not found');
      //   return;
      // }
      function streamToString (stream) {
        const chunks = [];
        return new Promise((resolve, reject) => {
          stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
          stream.on('error', (err) => reject(err));
          stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
        })
      }

      const client = new Client.Client(CLIENT_CONFIG);

      const testJSONStr = '{ "Id": 1, "Name": "Coke" }'

      const encryptParams = new Client.EncryptParamsBuilder()
        .withStringSource(testJSONStr)
        .withOffline()
        .build();

      // client.dataAttributes = [attributePrefix+"keycloakID"];

      console.log("before encrypt")

      const cipherTextStream = await client.encrypt(encryptParams);

      console.log("after encrypt, before remote")
      
      // const streamtext = await streamToString(cipherTextStream);
      // console.log(streamtext);

      cipherTextStream.toRemoteStore("keycloakuserid.tdf", s3ConfigJson).then(() => {
        setShowUploadSpinner(false);
        // setUploadFileList([]);
        // setSelectedFile(null);
        // setUploadedFiles([...uploadedFiles, {name: `keycloakuserid.tdf`, key: uploadedFiles.length + 1}])
        console.log("i think it went")
      });

      cipherTextStream.on('progress', progress => {
        console.log(`Uploaded ${progress.loaded} bytes`);
      });
    } catch (e) {
      setShowUploadSpinner(false);
      console.error(e);
    }
  };

  const onPanelChange = (value, mode) => {
    console.log("in onPanelChange")
    console.log("value: ", value)
    console.log("mode: ", mode)
    console.log(value.format('YYYY-MM-DD'), mode);
  };

  useEffect(() => {
    if (initialized) {
      keycloak.idToken ? toast.success(`Authenticated: ${keycloak.idToken}`) : null;
      sessionStorage.setItem('keycloak', keycloak.token || '');
      const tmp = localStorage.getItem('realm-tmp');

      if (!keycloak.authenticated && tmp) {
        localStorage.setItem('realm', tmp);
        localStorage.removeItem('realm-tmp');
        window.document.location.href = '/';
      }
    }
  }, [initialized, keycloak]);

  return (
    <React.StrictMode>
      <Layout>
        <Header>
          <div className='headerContainer'>
            <img className='logo' src={openTDFLogo} />
            <div className="userStatusContainer">
              <UserStatus />
            </div>
          </div>
        </Header>
        <Content className='contentContainer'>
          <div className='calendarContentWrapper'>
          <FullCalendar
        defaultView="dayGridMonth"
        plugins={[dayGridPlugin]}
        events={events}
      />
            <div className="spinnerContainer">
              <Spin spinning={showUploadSpinner}>
                <Button type='primary' onClick={lfsUpload} >
                  Log Day 
                </Button>
              </Spin>
            </div>
            <br></br>
            <div className="dot">Day 14 of Cycle</div>
          </div>
        </Content>
        <Footer>
        </Footer>
      </Layout>
    </React.StrictMode>
  );
};




export default App;
