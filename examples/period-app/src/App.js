import React, { useEffect, useState, useRef } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { useKeycloak } from '@react-keycloak/web';
import { Client, FileClient } from '@opentdf/client';
import { NanoTDFClient, AuthProviders} from '@opentdf/client';
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
import { fs } from 'fs'

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
const KAS_URL = "http://localhost:65432/api/kas";

// function download(data, filename, type) {
//   var file = new Blob([data], {type: type});
//   if (window.navigator.msSaveOrOpenBlob) // IE10+
//       window.navigator.msSaveOrOpenBlob(file, filename);
//   else { // Others
//       var a = document.createElement("a"),
//               url = URL.createObjectURL(file);
//       a.href = url;
//       a.download = filename;
//       document.body.appendChild(a);
//       a.click();
//       setTimeout(function() {
//           document.body.removeChild(a);
//           window.URL.revokeObjectURL(url);  
//       }, 0); 
//   }
// }


// const getKeycloakUserId = async (keycloak) => {
//   console.log("in get keycloak")
//   let users = "";
//   let auth = ""
//   let decoded = jwt_decode(keycloak.token);
//   console.log("decoded: ", decoded)
//   let username = decoded.sub;
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
  const [symptoms, setSymptoms] = useState(null);
  const [modalText, setModalText] = useState('Content of the modal');
  // const [current_data, setCurrentData] = useState({});
  const current_data = useRef({});
  const events = useRef([{ 
    start: new Date('7/7/2022'),
    end: new Date('7/10/2022'),
    allDay: true
  }, { 
    start: new Date('7/8/2022'),
    end: new Date('7/8/2022'),
    allDay: true,
    title: "Symptoms",
    description: 'Cramps, Headache'
  }]);

  const KEYCLOAK_HOST = "http://localhost:65432/auth"

  // const CLIENT_CONFIG = { // TODO: set this as env vars .etc
  //   clientId: keycloak.clientId,
  //   organizationName: keycloak.realm,
  //   exchange: 'refresh',
  //   oidcOrigin: keycloak.authServerUrl,
  //   oidcRefreshToken: keycloak.refreshToken,
  //   kasEndpoint: 'http://localhost:65432/api/kas',
  // };

  const oidcCredentials = {
    clientId: keycloak.clientId,
    exchange: 'refresh',
    oidcRefreshToken: keycloak.refreshToken,
    oidcOrigin: KEYCLOAK_HOST.replace('/auth', ''),
    organizationName: keycloak.realm
  }
  

  var CURRENT_DATA = {};

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = (val) => {
    setModalText('Securely Uploading your data...');
    lfsUpload(symptoms)
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

  // var events = [{ 
  //   start: new Date('7/7/2022'),
  //   end: new Date('7/10/2022'),
  //   allDay: true
  // }, { 
  //   start: new Date('7/8/2022'),
  //   end: new Date('7/8/2022'),
  //   allDay: true,
  //   title: "Symptoms",
  //   description: 'Cramps, Headache'
  // }];

  keycloak.onAuthError = console.log;

  const format_events = async (data) => {
    var e = [];
    let starts = data["periodStart"];
    let ends = data["periodEnd"];
    let symp = data["SYMPTOMS"];

    for (let i = 0; i < starts.length; i++) {
      if (i < ends.length){
        e.push({ 
          start: new Date(starts[i]),
          end: new Date(ends[i]),
          allDay: true,
          title: "Period"
        })
      }
      else{
        e.push({ 
          start: new Date(starts[i]),
          end: new Date(starts[i]),
          allDay: true,
          title: "Period Start"
        })
      }
    }

    for (let i = 0; i < symp.length; i++) {
        e.push({ 
          start: new Date(symp[i][0]),
          end: new Date(symp[i][0]),
          allDay: true,
          title: "Symptoms",
          description: symp[i][1].join(",")
        })
    }

    return e
  }

  // const format_data = async (symps) => {

  // }

  // function getData(ajaxurl, post_data) { 
  //   // return $.ajax({
  //   //   url: ajaxurl,
  //   //   type: 'GET',
  //   // });
  //   return $.ajax({ 
  //     type : "GET", 
  //     url : ajaxurl, 
  //     data : post_data,
  //     // beforeSend: function(xhr){xhr.setRequestHeader('Authorization', 'Bearer '+auth["access_token"]);},
  //     success : function(result) { 
  //         encrypted_bytes = $.parseJSON(result);
  //     }, 
  //     error : function(result) { 
  //       var json = $.parseJSON(result);
  //       console.log(json);
  //     } 
  //   });
  // };

  // function postData(ajaxurl, post_data) { 
  //   return $.ajax({ 
  //     type : "POST", 
  //     url : ajaxurl, 
  //     data : post_data,
  //     // beforeSend: function(xhr){xhr.setRequestHeader('Authorization', 'Bearer '+auth["access_token"]);},
  //     success : function(result) { 
  //         encrypted_bytes = $.parseJSON(result);
  //     }, 
  //     error : function(result) { 
  //       var json = $.parseJSON(result);
  //       console.log(json);
  //     } 
  //   });
  // };

  /******************************
   * ****************************
   * ************* READ *********
   * ****************************
   ******************************/

  const lfsDownload = async () => {

    

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

      let encrypted_bytes = "";

      // function getData(ajaxurl, ajaxdata) { 
      //   // return $.ajax({
      //   //   url: ajaxurl,
      //   //   type: 'GET',
      //   // });
      //   console.log("in get data")
      //   return $.ajax({ 
      //     type : "GET", 
      //     url : ajaxurl, 
      //     data : ajaxdata,
      //     // beforeSend: function(xhr){xhr.setRequestHeader('Authorization', 'Bearer '+auth["access_token"]);},
      //     success : function(result) { 
      //         encrypted_bytes = $.parseJSON(result);
      //     }, 
      //     error : function(result) { 
      //       var json = $.parseJSON(result);
      //       console.log(json);
      //     } 
      //   });
      // };

      async function getData(url = '', data = {}) {
        // Default options are marked with *
        const response = await fetch(url, {
          method: 'GET', // *GET, POST, PUT, DELETE, etc.
          // mode: 'no-cors', // no-cors, *cors, same-origin
          // cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
          // credentials: 'same-origin', // include, *same-origin, omit
          // headers: {
          //   'Content-Type': 'application/json'
          //   // 'Content-Type': 'application/x-www-form-urlencoded',
          // },
          // // redirect: 'follow', // manual, *follow, error
          // // referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
          // body: JSON.stringify(data) // body data type must match "Content-Type" header
        });
        return response.json(); // parses JSON response into native JavaScript objects
      }
  


      let post_data={"access_token": keycloak.token}
      console.log("before await get")
      let res = await getData("http://localhost:65432/period-backend/download?access_token="+keycloak.token)
      encrypted_bytes = res;
      console.log("after await get")
      console.log(encrypted_bytes)
      // $.ajax({ 
      //   type : "GET", 
      //   url : "http://localhost:65432/period-backend/download", 
      //   data : post_data,
      //   // beforeSend: function(xhr){xhr.setRequestHeader('Authorization', 'Bearer '+auth["access_token"]);},
      //   success : function(result) { 
      //       encrypted_bytes = $.parseJSON(result);
      //   }, 
      //   error : function(result) { 
      //     var json = $.parseJSON(result);
      //     console.log(json);
      //   } 
      // });
      console.log("before auth refresh")
      const authProvider = await AuthProviders.refreshAuthProvider(oidcCredentials);
      console.log("before client")
      const client = new NanoTDFClient(authProvider, KAS_URL);
      const clearText = await client.decrypt(encrypted_bytes);
      const decoder = new TextDecoder("utf-8");
      const decodedText = decoder.decode(clearText);
      const obj = JSON.parse(decodedText);
      console.log(obj);
      current_data.current = obj;
      console.log(current_data.current);


      let e = format_events(current_data.current);
      events.current = e;


      setShowDownloadSpinner(false)

      // const decryptParams = await new Client.DecryptParamsBuilder().setRemoteStore(
      //   fileToDecryptName,
      //   s3ConfigJson
      // );

      // const decryptedFileName = `${fileToDecryptName}.decrypted`;

      // const client = new Client.Client(CLIENT_CONFIG);

      // let plainTextStream = await client.decrypt(decryptParams);

      // plainTextStream
      //   .toFile("test_upload.txt")
      //   .then(() => {
      //     setShowDownloadSpinner(false);
      //   });
      // setShowDownloadSpinner(false)

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

     const lfsUpload = async (symps) => {
      try {
        if(!keycloak.authenticated) {
          toast.error('You must login to perform this action.');
          return;
        }
        console.log(symps);
        setShowUploadSpinner(true);
        console.log("before keys")
        var keys = Object.keys(symptoms);
        console.log(keys)
        // let post_data=JSON.parse('{"access_token":'+keycloak.token+', "data_type": ""}')
        let data_type = ""
        if (keys.includes("periodStart")) {
          data_type = "periodStart";
        }
        else if (keys.includes("periodEnd")) {
          data_type = "periodEnd";
        }
        else {
          data_type = "SYMPTOMS"
        }
          // console.log(post_data)
        let sympList = null;
        if ((keys.includes("periodStart") || keys.includes("periodEnd")) && keys.length>1 ){
          let acc = []
          for (var i = 0; i < keys.length; i++) {
            if(keys[i]!= "periodStart" && keys[i]!= "periodEnd"){
              acc.push(keys[i])
            }
          }
          sympList = acc;
        }
        // let bare_post_data = Object.assign(Object.create(null), post_data)
        // if (CURRENT_DATA){
        //   post_data["previous_data"] = CURRENT_DATA;
        // }
        // console.log(post_data)

        async function postData(url = '', data = {}) {
          // Default options are marked with *
          const response = await fetch(url, {
            method: 'POST', // *GET, POST, PUT, DELETE, etc.
            // mode: 'no-cors', // no-cors, *cors, same-origin
            // cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
            // credentials: 'same-origin', // include, *same-origin, omit
            headers: {
              'Content-Type': 'application/json'
              // 'Content-Type': 'application/x-www-form-urlencoded',
            },
            // redirect: 'follow', // manual, *follow, error
            // referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
            body: JSON.stringify(data) // body data type must match "Content-Type" header
          });
          return response.json(); // parses JSON response into native JavaScript objects
        }
        
        // postData('https://example.com/answer', { answer: 42 })
        //   .then(data => {
        //     console.log(data); // JSON data parsed by `data.json()` call
        //   });
      
        // function postData(ajaxurl, ajaxdata) { 
        //   console.log("in post ajax")
        //   return $.ajax({ 
        //     type : "POST", 
        //     url : ajaxurl, 
        //     // dataType: "json",
        //     data : {"access_token": keycloak.token, "data_type": data_type, "sympList":sympList},
        //     contentType:"application/json; charset=utf-8",
        //     dataType:"json",
        //     success : function(result) { 
        //         // encrypted_bytes = $.parseJSON(result);
        //         console.log("yay successful upload")
        //     }, 
        //     error : function(result) { 
        //       var json = $.parseJSON(result);
        //       console.log(json);
        //     } 
        //   });
        // };
        console.log("before await post")
        console.log(current_data.current)
        let send_data = {"access_token": keycloak.token, "data_type": data_type, "sympList": sympList}
        if (current_data.current && Object.keys(current_data.current).length !== 0){
          send_data = {"access_token": keycloak.token, "data_type": data_type, "sympList": sympList, "previous_data": current_data.current}
        }
        let res = await postData("http://localhost:65432/period-backend/upload", send_data
        )
        console.log(res)
        console.log("after await post")

        // $.ajax({ 
        //   type : "POST", 
        //   url : "http://localhost:65432/period-backend/upload", 
        //   data : post_data,
        //   // beforeSend: function(xhr){xhr.setRequestHeader('Authorization', 'Bearer '+auth["access_token"]);},
        //   success : function(result) { 
        //       console.log("yay successful upload")
        //   }, 
        //   error : function(result) { 
        //     var json = $.parseJSON(result);
        //     console.log(json);
        //   } 
        // });

        await lfsDownload();
        console.log("current data after download:");
        console.log(current_data);

        setShowUploadSpinner(false);
        await setSymptoms([]);





  
        // const keycloak_id = getKeycloakUserId()
        // if (!keycloak_id) {
        //   toast.error('Keycloak user not found');
        //   return;
        // }
        // function streamToString (stream) {
        //   const chunks = [];
        //   return new Promise((resolve, reject) => {
        //     stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        //     stream.on('error', (err) => reject(err));
        //     stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
        //   })
        // }
  
        // const client = new Client.Client(CLIENT_CONFIG);
  
        // const testJSONStr = '{ "Id": 1, "Name": "Coke" }'
        // // await download(testJSONStr, "test_upload.txt", "file");
        // fs.writeFile('./test_upload.txt', testJSONStr, err => {
        //   if (err) {
        //     console.error(err)
        //     return
        //   }
        //   //file written successfully
        // })
        // const encryptParams = new Client.EncryptParamsBuilder()
        //   fileReaderStream(toWebReadableStream(fileReaderStream('./test_upload.txt')))
        //   .withOffline()
        //   .build();
  
        // // client.dataAttributes = [attributePrefix+"keycloakID"];
  
        // console.log("before encrypt")
  
        // const cipherTextStream = await client.encrypt(encryptParams);
  
        // console.log("after encrypt, before remote")
        
        // // const streamtext = await streamToString(cipherTextStream);
        // // console.log(streamtext);
  
        // cipherTextStream.toRemoteStore("keycloakuserid.tdf", s3ConfigJson).then(() => {
        //   setShowUploadSpinner(false);
        //   // setUploadFileList([]);
        //   // setSelectedFile(null);
        //   // setUploadedFiles([...uploadedFiles, {name: `keycloakuserid.tdf`, key: uploadedFiles.length + 1}])
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
      lfsDownload();
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
        events={() => {
          return events.current
        }}
      //   eventDidMount={function(info) {
      //       new Tooltip(info.el, {
      //       title: "Symptoms: " + event.description,
      //       placement: 'top',
      //       trigger: 'hover',
      //       container: 'body'
      //     });
      //   }
      // }
        // eventClick={function(info) {
        //   new Tooltip(info.el, {
        //     title: "Symptoms: " + event.description,
        //     placement: 'top',
        //     trigger: 'hover',
        //     container: 'body'
        //   });
        // eventClick={function(info) {

        //   var tooltip = new Tooltip(info.el, {
     
        //     title: info.event.extendedProps.description,
     
        //     placement: 'top',
     
        //     trigger: 'hover',
     
        //     container: 'body'
     
        //   });
     
        // }}
      
          // change the border color just for fun
          // info.el.style.borderColor = 'red';
        
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
      <Checkbox onChange={(val, checked) => checked &&= setSymptoms({...symptoms, periodStart: new Date()})}> Did you start your period today?</Checkbox>
      <Checkbox onChange={(val, checked) => checked &&= setSymptoms({...symptoms, periodEnd: new Date()})}> Did you finish your period today?</Checkbox>
      <br></br>
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
