import React, { useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { useKeycloak } from '@react-keycloak/web';
import { Client, FileClient } from '@opentdf/client';
import { Button, Divider, Input, Layout, Select, Space, Spin, Table, Tooltip, Typography, Upload } from 'antd';
import { ToolOutlined } from '@ant-design/icons';
import { PlusOutlined, UploadOutlined } from '@ant-design/icons';
import fileReaderStream from 'filereader-stream';
import UserStatus from "./components/UserStatus";
import openTDFLogo from './assets/images/logo-masked-group.png';
import './App.css';

const { Header, Footer, Content } = Layout;
const { TextArea } = Input;


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

  const tableColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (text, record, index) => (
        <div className="spinnerContainer">
          <Spin spinning={showDownloadSpinner}>
            <Button onClick={() => lfsDownload(text, record, index)}>Download/Decrypt</Button>
          </Spin>
        </div>
      ),
    }
  ];

  keycloak.onAuthError = console.log;

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

    const s3ConfigJson = validateJsonStr(s3Config);

    // Checks for falsey values, empty valid objects, and invalid objects
    if(!s3ConfigJson) {
      toast.error('Please enter a valid S3 compatible json object.');
      return;
    }

    await setSavedS3Configs([...savedS3Configs, {name: newS3Name, data: s3Config, key: savedS3Configs.length + 1}])
    await setNewS3Name('');
  };

  const lfsDownload = async (text, record, index) => {

    if(!keycloak.authenticated) {
      toast.error('You must login to perform this action.');
      return;
    }

    const fileToDecryptName = record.name;

    console.log("record: ", record)
    console.log("txt: ", text)

    // const s3ConfigJson = validateJsonStr(s3Config);

    // if(!s3ConfigJson) {
    //   toast.error('Please enter a valid S3 compatible json object.');
    //   return;
    // }

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
    try {
      if(!keycloak.authenticated) {
        toast.error('You must login to perform this action.');
        return;
      }

      // if(!selectedFile) {
      //   toast.error('Please select a file to upload/encrypt.');
      //   return;
      // }

      const s3ConfigJson = validateJsonStr(s3Config);

      // Checks for falsey values, empty valid objects, and invalid objects
      if(!s3ConfigJson) {
        toast.error('Please enter a valid S3 compatible json object.');
        return;
      }

      setShowUploadSpinner(true);

      const client = new Client.Client(CLIENT_CONFIG);

      const testJSONStr = '{ "Id": 1, "Name": "Coke" }'

      const encryptParams = new Client.EncryptParamsBuilder()
        .withStringSource(testJSONStr)
        .withOffline()
        .build();

      const cipherTextStream = await client.encrypt(encryptParams);

      cipherTextStream.toRemoteStore(`${selectedFile.name}.tdf`, s3ConfigJson).then(data => {
        setShowUploadSpinner(false);
        setUploadFileList([]);
        setSelectedFile(null);
        setUploadedFiles([...uploadedFiles, {name: `${selectedFile.name}.tdf`, key: uploadedFiles.length + 1}])
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
            <span className='logoTitle'> - Period Tracking App</span>
            <div className="userStatusContainer">
              <UserStatus />
            </div>
          </div>
        </Header>
        <Content className='contentContainer'>
          <br/>
          <br/>
          <h3>Enter your sentitve data</h3><br/>
          <br/>
          <TextArea className='newS3TextArea' rows={5} value={s3Config} onChange={handleTextBoxChange}  />
          <br/>
          <br/>
          <div className="spinnerContainer">
            <Spin spinning={showUploadSpinner}>
              <Button type='primary' onClick={lfsUpload} >
                Encrypt and Upload
              </Button>
            </Spin>
          </div>
          <br/>
          <Divider plain>Uploaded Files</Divider>
          <Table locale={{ emptyText: 'No uploaded files' }} className='uploadedFilesTable' dataSource={uploadedFiles} columns={tableColumns} />
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
