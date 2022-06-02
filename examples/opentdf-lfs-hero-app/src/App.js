import React, { useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { useKeycloak } from '@react-keycloak/web';
import { Client, FileClient } from '@opentdf/client';
import { Button, Divider, Input, Layout, Select, Space, Table, Tooltip, Typography, Upload } from 'antd';
import { ToolOutlined } from '@ant-design/icons';
import { PlusOutlined, UploadOutlined } from '@ant-design/icons';
import fileReaderStream from 'filereader-stream';
import openTDFLogo from './assets/images/logo-masked-group.png';
import './App.css';

const { Header, Footer, Content } = Layout;
const { TextArea } = Input;

const App = () => {
  const { keycloak, initialized } = useKeycloak();
  const [opentdfClient, setOpentdfClient] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [s3Config, setS3Config] = useState({});
  const [savedS3Configs, setSavedS3Configs] = useState([{data: 'hi', key: 1},{data: 'there', key: 2}]);

  const CLIENT_CONFIG = { // TODO: set this as env vars .etc
    clientId: keycloak.clientId,
    organizationName: keycloak.realm,
    exchange: 'refresh',
    oidcOrigin: keycloak.authServerUrl,
    oidcRefreshToken: keycloak.refreshToken,
    kasEndpoint: 'http://localhost:65432/api/kas',
  };

  const tooltipExampleText = `Example: \n\n
  {
    "Bucket": "myBucketName",
    "credentials": {
      "accessKeyId": "IELVUWIEUD7U99JHPPES",
      "secretAccessKey": "N7RTPIqNRR7iqRo/a9WnrXryq7hSQvpCjVueRXLo"
    },
    "region": "us-east-2",
    "signatureVersion": "v4",
    "s3ForcePathStyle": true
  }`;

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
        <Space size="middle">
          <Button onClick={() => lfsDownload(text, record, index)}>Download/Decrypt</Button>
        </Space>
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


  const handleFileSelect = (file) => {
    setSelectedFile(file);
    return false;
  }

  const handleS3ConfigSelect = (e) => {
    console.log('s3 config drop down selection change: ', e);
  };

  const handleTextBoxChange = async (e) => {
    await setS3Config(e.target.textContent);
  }

  const handleSaveS3Config = (e) => {
    e.preventDefault();
    console.log('handleSaveS3Config: ', e);
  };

  const lfsDownload = async (text, record, index) => {
    toast.success('Download/Decryption started');

    const fileToDecryptName = record.name;

    const s3ConfigJson = validateJsonStr(s3Config);

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
        toast.success('Download/Decryption complete');
      });
  };

  const lfsUpload = async () => {
    try {
      const s3ConfigJson = validateJsonStr(s3Config);

      // Checks for falsey values, empty valid objects, and invalid objects
      if(!s3ConfigJson) {
        toast.error('Please enter a valid S3 compatible json object.');
      }
      else{
        toast.success('Valid S3 config loaded.');
      }

      const client = new Client.Client(CLIENT_CONFIG);

      const encryptParams = new Client.EncryptParamsBuilder()
        .withStreamSource(fileReaderStream(selectedFile))
        .withOffline()
        .build();

      const cipherTextStream = await client.encrypt(encryptParams);

      cipherTextStream.toRemoteStore(`${selectedFile.name}.tdf`, s3ConfigJson).then(data => {
        setUploadedFiles([...uploadedFiles, {name: `${selectedFile.name}.tdf`, key: uploadedFiles.length + 1}])
      });

      cipherTextStream.on('progress', progress => {
        console.log(`Uploaded ${progress.loaded} bytes`);
      });
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (initialized) {
      toast.success(`Authenticated: ${keycloak.idToken}`);
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
          <div>
            <img className='logo' src={openTDFLogo} style={{ width: '180px', height: '50px'}} />
            <span style={{ color: 'white', fontSize: 'large' }}> - Remote File Upload</span>
          </div>
        </Header>
        <Content style={{ textAlign: 'center' }}>
          <br/>
          <h4>Upload a file as an encrypted TDF to an S3 compatible remote store</h4><br/>
          {/* <Button type='text' onClick={testClient}>Test</Button> */}
          <Upload style={{ width: 'calc(20%)' }} multiple={false} maxCount={1} showUploadList={{showRemoveIcon: true}} removeIcon={true} beforeUpload={handleFileSelect}>
            <Button type='upload' icon={<UploadOutlined />}>Select File</Button>
          </Upload>
          <br/>
          <Input.Group compact style={{ margin: 'auto', width: '80%' }}>
            <Tooltip title={tooltipExampleText}>
              <Space style={{ display: 'inline-flex', width: 'calc(50%)', margin: 'auto', justifyContent: 'center' }}>
                <span>Enter an S3 compatible configuration object</span>
                <ToolOutlined />
              </Space>
            </Tooltip>
            <TextArea rows={4} style={{ textAlign: 'left', width: 'calc(50%)', display: 'block', margin: 'auto'}} onBlur={(e) => {handleTextBoxChange(e)}} />
          </Input.Group>
          <h3 style={{margin: '2px', display: 'inline'}}><span style={{ color: 'red', fontWeight: 'bold' }}>*</span></h3>
          <Select
            style={{
              width: 309,
            }}
            placeholder="Add or select remote store"
            dropdownRender={(menu) => (
              <>
                {menu}
                <Divider
                  style={{
                    margin: '8px 0',
                  }}
                />
                <Space
                  align="center"
                  style={{
                    padding: '0 8px 4px',
                  }}
                >
                  <Input placeholder="Remote store name" value={name} onChange={handleS3ConfigSelect} />
                  <Typography.Link
                    onClick={handleSaveS3Config}
                    style={{
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <PlusOutlined /> Save remote store
                  </Typography.Link>
                </Space>
              </>
            )}
          >
            {savedS3Configs.map((s3Config) => (
              <Select.Option key={s3Config.key}>{s3Config.data}</Select.Option>
            ))}
          </Select>
          <br/>
          <br/>
          <Button type='primary' onClick={lfsUpload} >Encrypt and Upload</Button>
          <br/>
          <Divider plain>Uploaded Files</Divider>
          <Table locale={{ emptyText: 'No uploaded files' }} style={{ margin: 'auto', width: 'calc(60%)' }} dataSource={uploadedFiles} columns={tableColumns} />
        </Content>
        <Footer>
        </Footer>
      </Layout>
      <h3 style={{margin: '20px'}}><span style={{ color: 'red', fontWeight: 'bold' }}>*</span> = Optional</h3>
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
