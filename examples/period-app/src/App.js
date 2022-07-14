import React, { useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { useKeycloak } from '@react-keycloak/web';
import { Client, FileClient } from '@opentdf/client';
import { Button, Divider, Input, Layout, Select, Space, Spin, Table, Tooltip, Typography, Upload, Modal } from 'antd';
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

import { validateJsonStr } from './utils';

const { Header, Footer, Content } = Layout;

const s3ConfigJson = validateJsonStr(`
{
  "Bucket": "hackathon-period",
  "credentials": {
    "accessKeyId": "AKIA2KZCE7Q56T7ZXTFY",
    "secretAccessKey": "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"
  },
  "region": "us-east-2",
  "signatureVersion": "v4",
  "s3ForcePathStyle": true
}
`)

const getKeycloakUserId = async (keycloak) => {
  console.log("in get keycloak")
  let users = "";
  let auth = ""
  let decoded = jwt_decode(keycloak.token);
  console.log("decoded: ", decoded)
  let username = decoded.sub;
  // i think we need a specific user with the view-users role to 
  let post_data={"grant_type": "password", "username": "keycloakadmin", "password": "mykeycloakpassword", "client_id":"admin-cli"}
  $.ajax({ 
    type : "POST", 
    url : keycloak.authServerUrl+"/auth/realms/master/protocol/openid-connect/token", 
    data : post_data,
    success : function(result) { 
        auth = $.parseJSON(result);
    }, 
    error : function(result) { 
      var json = $.parseJSON(data);
      console.log(json);
    } 
  });
  $.ajax({ 
    type : "GET", 
    url : keycloak.authServerUrl+"/admin/realms/tdf/users", 
    beforeSend: function(xhr){xhr.setRequestHeader('Authorization', 'Bearer '+auth["access_token"]);},
    success : function(result) { 
        users = $.parseJSON(result);
    }, 
    error : function(result) { 
      var json = $.parseJSON(data);
      console.log(json);
    } 
  });
  let id = null;
  for (const u of users){
    if (u["username"]==username){
      id = u["id"]
      return id;
    }
  }
  return id;
};

const attributePrefix = "http://period.com/attr/tracker/value/"


const App = () => {
  const { keycloak, initialized } = useKeycloak();
  const [opentdfClient, setOpentdfClient] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [s3Config, setS3Config] = useState('');
  const [showUploadSpinner, setShowUploadSpinner] = useState(false);
  const [showDownloadSpinner, setShowDownloadSpinner] = useState(false);
  const [uploadFileList, setUploadFileList] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  //symptoms
  const [symptoms, setSymptoms] = useState([]);
  const [modalText, setModalText] = useState('Content of the modal');

  const CLIENT_CONFIG = { // TODO: set this as env vars .etc
    clientId: keycloak.clientId,
    organizationName: keycloak.realm,
    exchange: 'refresh',
    oidcOrigin: keycloak.authServerUrl,
    oidcRefreshToken: keycloak.refreshToken,
    kasEndpoint: 'http://localhost:65432/api/kas',
  };

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = (val) => {
    setModalText('Securely Uploading your data...');
    lfsUpload()
    setConfirmLoading(true);
    setTimeout(() => {
      setIsModalVisible(false);
      setConfirmLoading(false);
      toast.success("Your data has been securely uploaded!")
      console.log(val)
    }, 2000);
  };

  const handleCancel = () => {
    console.log('Clicked cancel button');
    setIsModalVisible(false);
  };

  const events = [{ 
    start: new Date('July 8, 2022 23:15:30'),
    end: new Date('July 14, 2022 23:15:30'),
    allDay: true
  }];

  keycloak.onAuthError = console.log;

  /******************************
   * ****************************
   * ************* READ *********
   * ****************************
   ******************************/

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

    // const fileToDecryptName = keycloak_id+".tdf";

    // console.log("record: ", record)
    // console.log("txt: ", text)

    try {
      setShowDownloadSpinner(true);

      const decryptParams = await new Client.DecryptParamsBuilder().setRemoteStore(
        fileToDecryptName,
        s3ConfigJson
      );

      const decryptedFileName = `${fileToDecryptName}.decrypted`;

      const client = new Client.Client(CLIENT_CONFIG);

      let plainTextStream = await client.decrypt(decryptParams);

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

    /*****************************
   * *****************************
   * ************* WRITE *********
   * *****************************
   *******************************/

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

  useEffect(() => {
    if (initialized) {
      // console.log("keycloak decode : ", jwt.decode(keycloak))
      console.log("keycloak : ", keycloak)
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
                <Button className="log-button" type='primary' onClick={showModal} >
                  Log Day 
                </Button>
              </Spin>
            </div>
            <Modal
        title="Log for Today"
        okText="Submit"
        visible={isModalVisible}
        onOk={() => handleOk(symptoms)}
        confirmLoading={confirmLoading}
        onCancel={handleCancel}
      >
      <Checkbox onChange={(val, checked) => checked &&= setSymptoms(...symptoms, {periodStart: new Date()})}> Did you start your period today?</Checkbox>
      <Checkbox onChange={(val, checked) => checked &&= setSymptoms(...symptoms, {periodEnd: new Date()})}> Did you finish your period today?</Checkbox>
    <p>Symptoms</p>
    <Checkbox onChange={(val, checked) => setSymptoms({...symptoms, headache: checked})}>Headache</Checkbox>
    <Checkbox onChange={(val, checked) => setSymptoms({...symptoms, cramps: checked})}>Cramps</Checkbox>
    <Checkbox onChange={(val, checked) => setSymptoms({...symptoms, backpain: checked})}>Back Pain</Checkbox>
    <Checkbox onChange={(val, checked) => setSymptoms({...symptoms, nausea: checked})}>Nausea</Checkbox>

  {/* <Checkbox onChange={(value) => value &&= setSymptoms(...symptoms, {periodStart: new Date()})}> Did you start your period today?</Checkbox>
      <Checkbox onChange={(value) => value &&= setSymptoms(...symptoms, {periodEnd: new Date()})}> Did you finish your period today?</Checkbox>
  <CheckboxGroup name="checkboxList">
    <p>Symptoms</p>
    <Checkbox onChange={(value) => setSymptoms(...symptoms, {headache: value})}>Headache</Checkbox>
    <Checkbox onChange={(value) => setSymptoms(...symptoms, {cramps: value})}>Cramps</Checkbox>
    <Checkbox onChange={(value) => setSymptoms(...symptoms, {backpain: value})}>Back Pain</Checkbox>
    <Checkbox onChange={(value) => setSymptoms(...symptoms, {nausea: value})}>Nausea</Checkbox>
  </CheckboxGroup> */}
      </Modal>
            <br></br>
            <div className="dot">Day 14 of Cycle</div>
          </div>
        </Content>
        <Footer>
        </Footer>
      </Layout>
      <ToastContainer
        position="bottom-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss={false}
        draggable
        pauseOnHover={false}
      />
    </React.StrictMode>
  );
};




export default App;
