import React, { useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { useKeycloak } from '@react-keycloak/web';
import { Client, FileClient } from '@opentdf/client';
import { Button, Input, Layout, Menu, message, Space, Table, Tooltip, Upload } from 'antd';
import { ToolOutlined } from '@ant-design/icons';
import { UploadOutlined } from '@ant-design/icons';
import fileReaderStream from 'filereader-stream';
import openTDFLogoRound from './assets/images/opentdf-logo-final-03.png';
import openTDFLogoText from './assets/images/logo-masked-group.png';


const { Header, Footer, Content } = Layout;
const { TextArea } = Input;





function App() {
  const { keycloak, initialized } = useKeycloak();
  const [opentdfClient, setOpentdfClient] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [columns, setColumns] = useState(tableColumns);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [s3Config, setS3Config] = useState({});

  const CLIENT_CONFIG = {
    clientId: keycloak.clientId,
    organizationName: keycloak.realm,
    exchange: 'refresh',
    oidcOrigin: keycloak.authServerUrl,
    oidcRefreshToken: keycloak.refreshToken,
    kasEndpoint: 'http://localhost:65432/api/kas',
  };

  const REMOTE_PARAMS = {
    Bucket: 'tdfcftbucket',
    credentials: {
      accessKeyId: 'AKIAVKIEUD7U65JHJJES',
      secretAccessKey: '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'
    },
    region: 'us-east-2',
    signatureVersion: 'v4',
    s3ForcePathStyle: true
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
      render: (text, record) => (
        <Space size="middle">
          <Button onClick={handleDownload}>Download</Button>
          <Button>Delete</Button>
        </Space>
      ),
    }
  ];

  console.log('keycloak: ', keycloak);
  keycloak.onAuthError = console.log;

  const handleDownload = (text, record) => {
    console.log('handleDownload() record: ', record);
    console.log('handleDownload() text: ', text);
  }

  const validateJsonStr = (jsonString) => {
    try {
      console.log('about to parse: ', jsonString);
      var o = JSON.parse(jsonString);
      console.log('parsed it: ', o);
      // Handle non-exception-throwing cases:
      // Neither JSON.parse(false) or JSON.parse(1234) throw errors, hence the type-checking,
      // but... JSON.parse(null) returns null, and typeof null === "object",
      // so we must check for that, too. Thankfully, null is falsey, so this suffices:
      if (o && typeof o === "object") {
          setS3Config(o);
          return o;
      }
    }
    catch (e) {
      console.log(e);
    }

    return false;
  };

  const handleFileSelect = (file) => {
    console.log('file: ', file);
    setSelectedFile(file);
    return false;
  }

  const lfsUpload = async () => {
    try {
      const s3ConfigJson = validateJsonStr(s3Config);
      console.log('S3 config right after validate: ', s3ConfigJson);

      // Checks for falsey values, empty valid objects, and invalid objects
      if(!s3ConfigJson || (typeof s3ConfigJson === "object" && !Object.keys(s3ConfigJson).length)) {
        toast.error('Please enter a valid S3 compatible json object.');
      }
      else{
        toast.success('Valid S3 config loaded.');
        console.log('s3 config: ', s3ConfigJson["a"]);
      }

      const client = new Client.Client(CLIENT_CONFIG);

      const encryptParams = new Client.EncryptParamsBuilder()
        // .withStringSource('hello world')
        .withStreamSource(fileReaderStream(selectedFile))
        .withOffline()
        .build();

      const cipherTextStream = await client.encrypt(encryptParams);

      cipherTextStream.toRemoteStore(`${selectedFile.name}.tdf`, REMOTE_PARAMS).then(data => {
        console.log('Upload complete');
        console.log(data);
        setUploadedFiles([...uploadedFiles, {name: `${selectedFile.name}.tdf`, key: uploadedFiles.length + 1}])
      });

      cipherTextStream.on('progress', progress => {
        console.log(`Uploaded ${progress.loaded} bytes`);
        console.log(progress);
      });
    } catch (e) {

    }
  };


  const testClient = async () => {
    console.log('sah 1');
    try {
      console.log('oidcOrigin from app: ', keycloak.authServerUrl);

      const client = new Client.Client(CLIENT_CONFIG);
      console.log('sah 2');
      // setOpentdfClient(client);
      console.log('sah 3');
      console.log('OpenTDF client: ', client);

      const encryptParams = new Client.EncryptParamsBuilder()
        .withStringSource('hello world')
        .withOffline()
        .build();
      console.log('sah 4');
      const cipherTextStream = await client.encrypt(encryptParams);
      console.log('sah 5');
      const decryptParams = new Client.DecryptParamsBuilder()
        .withStreamSource(cipherTextStream)
        .build();
      console.log('sah 6');
      const plainTextStream = await client.decrypt(decryptParams);
      console.log('sah 7');
      console.log('Decrypted text: ', await plainTextStream.toString());
    } catch (err) {
      console.log(err);
    }
  }

  useEffect(() => {
    if (initialized) {
      toast.success(`Authenticated: ${keycloak.idToken}`);
      console.log('keycloak idToken: ', keycloak.idToken);
      sessionStorage.setItem('keycloak', keycloak.token || '');
      const tmp = localStorage.getItem('realm-tmp');
      console.log('realm: ', keycloak.realm);

      if(keycloak.authenticated) {
        // testClient();
      }

      if (!keycloak.authenticated && tmp) {
        localStorage.setItem('realm', tmp);
        localStorage.removeItem('realm-tmp');
        window.document.location.href = '/';
      }
    }
  }, [initialized, keycloak]);

  // useEffect(() => {
  //   console.log('config log: ', s3Config);
  // }, [s3Config]);



  return (
    <React.StrictMode>
      <Layout>
        <Header>
          <div>
            <img className='logo' src={openTDFLogoText} style={{ width: '180px', height: '50px'}} />
            <span style={{ color: 'white', fontSize: 'large' }}> - Remote File Upload</span>
          </div>
        </Header>
        <Content style={{ textAlign: 'center' }}>
          <div>
            <br/>
            <h4>Upload a file as an encrypted TDF to an S3 compatible remote store</h4><br/>
            {/* <Button type='text' onClick={testClient}>Test</Button> */}
            <Upload style={{ width: 'calc(20%)' }} multiple={false} maxCount={1} showUploadList={{showRemoveIcon: true}} removeIcon={true} beforeUpload={handleFileSelect}>
              <Button type='upload' icon={<UploadOutlined />}>Select File</Button>
            </Upload>
            <br/>
            <Input.Group compact>
              <Tooltip title="prompt text">
                <Space style={{ display: 'inline-flex'}}>
                  <span>Enter an S3 compatible configuration object</span>
                  <ToolOutlined />
                </Space>
              </Tooltip>
              <TextArea rows={4} style={{ width: 'calc(20%)' }} onChange={(e) => setS3Config(e.target.textContent)} placeholder='Enter an S3 compatible configuration object' />
            </Input.Group>
            <Button type='primary' onClick={lfsUpload} >Encrypt and Upload</Button>
            <br/>
            Uploaded files
            <Table style={{ width: 'calc(80%)' }} dataSource={uploadedFiles} columns={tableColumns} />;
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
