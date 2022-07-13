import React, { useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { useKeycloak } from '@react-keycloak/web';
import { Client, FileClient } from '@opentdf/client';
import { Button, Divider, Input, Layout, Select, Space, Spin, Table, Tooltip, Typography, Upload, Modal } from 'antd';
import { ToolOutlined } from '@ant-design/icons';
import { PlusOutlined, UploadOutlined } from '@ant-design/icons';
import fileReaderStream from 'filereader-stream';
import UserStatus from "./components/UserStatus";
import openTDFLogo from './assets/images/period-logo.png';
import './App.css';
import FullCalendar from '@fullcalendar/react' 
import dayGridPlugin from '@fullcalendar/daygrid'
import jwt_decode from "jwt-decode"

const { Header, Footer, Content } = Layout;
const { TextArea } = Input;


const validateJsonStr = (jsonString) => {
  try {
    var o = JSON.parse(jsonString);
    // Handle non-exception-throwing cases:
    // Neither JSON.parse(false), JSON.parse(1234), or JSON.parse({}) throw errors, hence the type-checking,
    // but... JSON.parse(null) returns null, and typeof null === "object",
    // so we must check for that, too. Thankfully, null is falsey, so this suffices:
    if (o && typeof o === "object" && Object.keys(o).length) {
        return o;
    }
  }
  catch (e) {
    console.error(e);
  }

  return false;
};

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
const CycleInfo = () => {

}

const getKeycloakUserId = async (keycloak) => {
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

  const handleOk = () => {
    setModalText('The modal will be closed after two seconds');
    setConfirmLoading(true);
    setTimeout(() => {
      setIsModalVisible(false);
      setConfirmLoading(false);
    }, 2000);
  };

  const handleCancel = () => {
    console.log('Clicked cancel button');
    setIsModalVisible(false);
  };


  const events = [{ title: "today's event", date: new Date() }];

  keycloak.onAuthError = console.log;

  const lfsDownload = async (text, record, index) => {

    if(!keycloak.authenticated) {
      toast.error('You must login to perform this action.');
      return;
    }

    const fileToDecryptName = record.name;

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

      plainTextStream
        .toFile(decryptedFileName)
        .then(() => {
          setShowDownloadSpinner(false);
        });
    } catch (e) {
      setShowDownloadSpinner(false);
      console.error(e);
    }
  };

  const lfsUpload = async () => {
    console.log("in lfs upload")
    //const keycloakUserID = await getKeycloakUserId(keycloak)
    try {
      if(!keycloak.authenticated) {
        toast.error('You must login to perform this action.');
        return;
      }

      setShowUploadSpinner(true);

      const client = new Client.Client(CLIENT_CONFIG);

      const testJSONStr = '{ "Id": 1, "Name": "Coke" }'

      const encryptParams = new Client.EncryptParamsBuilder()
        .withStringSource(testJSONStr)
        .withOffline()
        .build();

      // const cipherTextStream = await client.encrypt(encryptParams);

      // cipherTextStream.toRemoteStore(`thisisatest.tdf`, s3ConfigJson).then(data => {
      //   setShowUploadSpinner(false);
      //   setUploadFileList([]);
      //   setSelectedFile(null);
      //   setUploadedFiles([...uploadedFiles, {name: `${selectedFile.name}.tdf`, key: uploadedFiles.length + 1}])
      //   console.log("i think it went")
      // });

      // cipherTextStream.on('progress', progress => {
      //   console.log(`Uploaded ${progress.loaded} bytes`);
      // });
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
                <Button type='primary' onClick={showModal} >
                  Log Day 
                </Button>
              </Spin>
            </div>
            <Modal
        title="Title"
        visible={isModalVisible}
        onOk={handleOk}
        confirmLoading={confirmLoading}
        onCancel={handleCancel}
      >
        <p>{modalText}</p>
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
