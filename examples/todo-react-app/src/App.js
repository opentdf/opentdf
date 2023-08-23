import React, { useState, useRef, useEffect } from "react";
import Form from "./components/Form";
import FilterButton from "./components/FilterButton";
import Todo from "./components/Todo";
import { nanoid } from "nanoid";
import { useKeycloak } from '@react-keycloak/web';
import { Client } from '@opentdf/client';
import Drawer from '@mui/material/Drawer';
import { Timeline,
  TimelineItem,
  TimelineContent,
  TimelineSeparator,
  TimelineConnector,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';
import { LockOpen, LockPerson, Lock, RemoveCircle, ViewHeadline } from '@mui/icons-material';


function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

const FILTER_MAP = {
  All: () => true,
  Active: (task) => !task.completed,
  Completed: (task) => task.completed,
};

const FILTER_NAMES = Object.keys(FILTER_MAP);

//const DATA = [
//   { id: "todo-0", name: "Eat", completed: true, protected: false },
//   { id: "todo-1", name: "Sleep", completed: false, protected: false },
//   { id: "todo-2", name: "Repeat", completed: false, protected: false },
// ];

function App() {
  const attributes = ['platform',   'saas']
  const [attribute, setAttribute] = useState(attributes[0])
  const [tasks, setTasks] = useState(localStorage.getItem('tasks') ? JSON.parse(localStorage.getItem('tasks')) : []);
  const [filter, setFilter] = useState("All");
  const { keycloak, initialized } = useKeycloak();
  const [encrypt, setEncrypt] = useState(null);
  const [decrypt, setDecrypt] = useState(null);
  const [showAudit, setShowAudit] = useState(false);
  const [events, setEvents] = useState([]);

  const KAS_URL = 'http://localhost:65432/api/kas';

  useEffect(() => {
    fetch("http://localhost:8080/api/v1/events?objectName=todo", {
      method: 'GET',
      // mode: "no-cors",
      headers: {
        'X-Request-Version': 'v2',
      },
    }).then(response => response.json()).then(response => response.newEvents && setEvents(response.newEvents))
  }, [showAudit])

  useEffect(() => {
    if (initialized && keycloak.authenticated) {
      const CLIENT_CONFIG = {
        clientId: keycloak.clientId,
        organizationName: keycloak.realm,
        exchange: 'refresh',
        oidcOrigin: 'http://localhost:65432/auth/realms/tdf',
        refreshToken: keycloak.refreshToken,
        kasEndpoint: KAS_URL,
      };

      const encryptTask = async (id, name, team) => {
        const client = new Client.Client(CLIENT_CONFIG);
        const encryptedStream = await client.encrypt(
          new Client.EncryptParamsBuilder()
            .withStringSource(name)
            .withOffline()
            .withAttributes([{ attribute: `https://todo.com/attr/${team}/value/developer` }])
            .build()
        );
        const encyptedBuffer = new Uint8Array(await new Response(encryptedStream.stream).arrayBuffer());

        const tdfId = await client.getPolicyId({ source: { type: 'buffer', location: encyptedBuffer }})
        const newName = window.btoa([...encyptedBuffer].map(byte => String.fromCharCode(byte)).join(''));

        setTasks((currentTasks) => currentTasks.map((task) => {
          // if this task has the same ID as the edited task
          if (id === task.id) {
            return { ...task, name: newName, tdfId, protected: true, owner: keycloak.tokenParsed.preferred_username };
          }
          return task;
        }))
        await fetch('http://localhost:8080/api/v1/write', {
          method: 'POST',
          mode: "no-cors", // no-cors, *cors, same-origin
          body: JSON.stringify([
            {
              "message": JSON.stringify({
                "action": {
                  "result": "success", //[ success, failure, error ]
                  "type": "create" // [ create, update, delete, read ]
                },
                "clientInfo": {
                  "platform": "todo-react-client",
                },
                "object": {
                  attributes: [
                    {
                      value: "developer",
                      key: team
                    }
                  ],
                  "id": tdfId,
                  "name": "todo",
                  "type": "data_object"
                },
                "owner": {
                  "id": keycloak.tokenParsed.preferred_username,
                  "orgId": "194cf2de-2613-42bd-a33f-a3f3a49a6e31"
                },
                "timestamp": new Date().toISOString()
              })
            }
          ])
        })
      }

      const decryptTask = async (id, name) => {
        const client = new Client.Client(CLIENT_CONFIG);
        let currentTask;
        try {
          const decryptedStream = await client.decrypt(
            new Client.DecryptParamsBuilder()
              .withArrayBufferSource(
                Uint8Array.from(
                  atob(name).split(''), char => char.charCodeAt(0)
                ).buffer
              ).build()
          );
          const decryptedText = await decryptedStream.toString();
          setTasks((currentTasks) => currentTasks.map((task) => {
            // if this task has the same ID as the edited task
            if (id === task.id) {
              currentTask = task;
              fetch('http://localhost:8080/api/v1/write', {
                method: 'POST',
                mode: "no-cors", // no-cors, *cors, same-origin
                body: JSON.stringify([
                  {
                    "message": JSON.stringify({
                      "action": {
                        "result": "success", //[ success, failure, error ]
                        "type": "read" // [ create, update, delete, read ]
                      },
                      "clientInfo": {
                        "platform": "todo-react-client",
                      },
                      "object": {
                        "id": task.tdfId,
                        "name": "todo",
                        "type": "data_object"
                      },
                      "actor": {
                        "id": keycloak.tokenParsed.preferred_username,
                      },
                      "owner": {
                        "id": task.owner,
                        "orgId": "194cf2de-2613-42bd-a33f-a3f3a49a6e31"
                      },
                      "timestamp": new Date().toISOString(),
                    })
                  }
                ])
              })

              return { ...task, decryptedText };
            }
            return task;
          }))
        } catch (e) {
          if (e.message.includes('403')) {
            alert('You dont have access to this task');
          } else {
            alert(`decryption failed: ${e.message}`);
          }
          fetch('http://localhost:8080/api/v1/write', {
            method: 'POST',
            mode: "no-cors", // no-cors, *cors, same-origin
            body: JSON.stringify([
              {
                "message": JSON.stringify({
                  "action": {
                    "result": "error", //[ success, failure, error ]
                    "type": "read" // [ create, update, delete, read ]
                  },
                  "clientInfo": {
                    "platform": "todo-react-client",
                  },
                  "object": {
                    "id": currentTask.tdfId,
                    "name": "todo",
                    "type": "data_object"
                  },
                  "actor": {
                    "id": keycloak.tokenParsed.preferred_username,
                  },
                  "owner": {
                    "id": currentTask.owner,
                    "orgId": "194cf2de-2613-42bd-a33f-a3f3a49a6e31"
                  },
                  "eventMetaData": e.message,
                  "timestamp": new Date().toISOString(),
                })
              }
            ])
          })
        }
      }

      setEncrypt(() => encryptTask);
      setDecrypt(() => decryptTask)
    }
  }, [initialized, keycloak.authenticated]);

  useEffect(() => {
    const tasksString = localStorage.getItem('tasks');
    const stateString = JSON.stringify(tasks.map(({ decryptedText, ...task }) => task ));
    if (tasksString !== stateString) {
      localStorage.setItem('tasks', stateString)
    }
  }, [tasks]);


  function toggleTaskCompleted(id) {
    const updatedTasks = tasks.map((task) => {
      // if this task has the same ID as the edited task
      if (id === task.id) {
        fetch('http://localhost:8080/api/v1/write', {
          method: 'POST',
          mode: "no-cors",
          body: JSON.stringify([
            {
              "message": JSON.stringify({
                "action": {
                  "result": "success", //[ success, failure, error ]
                  "type": "update" // [ create, update, delete, read ]
                },
                "clientInfo": {
                  "platform": "todo-react-client",
                },
                "object": {
                  "id": task.tdfId || task.id,
                  "name": "todo",
                  "type": "data_object"
                },
                "diff": { message: `"${task.tdfId || task.name}" status were set as ${!task.completed}`},
                "actor": {
                  "id": keycloak.tokenParsed.preferred_username,
                },
                "owner": {
                  "id": task.owner,
                  "orgId": "194cf2de-2613-42bd-a33f-a3f3a49a6e31",
                },
                "timestamp": new Date().toISOString(),
              })
            }
          ])
        })
        // use object spread to make a new obkect
        // whose `completed` prop has been inverted
        return { ...task, completed: !task.completed };
      }
      return task;
    });
    setTasks(updatedTasks);
  }

  function deleteTask(id) {
    const task = tasks.find((task) => id === task.id);
    fetch('http://localhost:8080/api/v1/write', {
      method: 'POST',
      mode: "no-cors",
      body: JSON.stringify([
        {
          "message": JSON.stringify({
            "action": {
              "result": "success", //[ success, failure, error ]
              "type": "delete" // [ create, update, delete, read ]
            },
            "clientInfo": {
              "platform": "todo-react-client",
            },
            "object": {
              "id": task.tdfId || task.id,
              "name": "todo",
              "type": "data_object"
            },
            "eventMetaData": task.tdfId || task.name,
            "owner": {
              "id": keycloak.tokenParsed.preferred_username,
              "orgId": "194cf2de-2613-42bd-a33f-a3f3a49a6e31",
            },
            "actor": {
              "id": keycloak.tokenParsed.preferred_username,
            },
            "timestamp": new Date().toISOString()
          })
        }
      ])
    })
    const remainingTasks = tasks.filter((task) => id !== task.id);
    setTasks(remainingTasks);
  }

  function editTask(id, newName) {
    const editedTaskList = tasks.map((task) => {
      // if this task has the same ID as the edited task
      if (id === task.id) {
        fetch('http://localhost:8080/api/v1/write', {
          method: 'POST',
          mode: "no-cors",
          body: JSON.stringify([
            {
              "message": JSON.stringify({
                "action": {
                  "result": "success", //[ success, failure, error ]
                  "type": "update" // [ create, update, delete, read ]
                },
                "clientInfo": {
                  "platform": "todo-react-client",
                },
                "object": {
                  "id": task.tdfId || task.id,
                  "name": "todo",
                  "type": "data_object"
                },
                "diff": { message: `Task "${task.name}" were renamed to "${newName}"`},
                "actor": {
                  "id": keycloak.tokenParsed.preferred_username,
                },
                "owner": {
                  "id": task.owner,
                  "orgId": "194cf2de-2613-42bd-a33f-a3f3a49a6e31",
                },
                "timestamp": new Date().toISOString(),
              })
            }
          ])
        })
        return { ...task, name: newName, };
      }
      return task;
    });
    setTasks(editedTaskList);
  }

  const taskList = tasks
    .filter(FILTER_MAP[filter])
    .filter(({team}) => team === attribute)
    .map((task) => (
      <Todo
        id={task.id}
        name={task.name}
        completed={task.completed}
        protected={task.protected}
        team={task.team}
        key={task.id}
        toggleTaskCompleted={toggleTaskCompleted}
        deleteTask={deleteTask}
        encryptTask={encrypt}
        decryptTask={decrypt}
        editTask={editTask}
        tdfId={task.tdfId}
        owner={task.owner}
        decryptedText={task.decryptedText}
      />
    ));

  const filterList = FILTER_NAMES.map((name) => (
    <FilterButton
      key={name}
      name={name}
      isPressed={name === filter}
      setFilter={setFilter}
    />
  ));

  function addTask(name) {
    const newTask = { id: "todo-" + nanoid(), name: name, completed: false, team: attribute, owner: keycloak.tokenParsed.preferred_username, };
    setTasks([...tasks, newTask]);
  }

  const tasksNoun = taskList.length !== 1 ? "tasks" : "task";
  const headingText = `${taskList.length} ${tasksNoun} remaining`;

  const listHeadingRef = useRef(null);
  const prevTaskLength = usePrevious(tasks.length);

  useEffect(() => {
    if (tasks.length - prevTaskLength === -1) {
      listHeadingRef.current.focus();
    }
  }, [tasks.length, prevTaskLength]);

  const iconMap = {
    'read': {
      icon: (
        <TimelineDot color="info">
          <LockOpen sx={{ color: 'white' }} />
        </TimelineDot>
      ),
      text: (event) => `Decrypted "${event.object.id}" by ${event.actor.id}`
    },
    'create': {
      icon: (
        <TimelineDot color="primary">
          <LockPerson sx={{ color: 'white' }} />
        </TimelineDot>
      ),
      text: (event) => `Encrypted "${event.object.id}" by ${event.owner.id}`
    },
    'delete': {
      icon: (
        <TimelineDot color="warning">
          <RemoveCircle sx={{ color: 'white' }} />
        </TimelineDot>
      ),
      text: (event) => `Removed "${event.object.id}" task by ${event.actor.id}`
    },
    'update': {
      icon: (
        <TimelineDot color="warning">
          <RemoveCircle sx={{ color: 'white' }} />
        </TimelineDot>
      ),
      text: (event) => <>{event.diff.message} by {event.actor.id}</>
    }
  }
  const parseTime = (timestamp) => {
    const date = new Date(timestamp);
    const formattedDate = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')} ${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')} (UTC)`;

    return formattedDate;
  }


//LockOpen, LockPerson, Lock, RemoveCircle, ViewHeadline
  return (
    <div className="todoapp stack-large">
      <Drawer
        anchor={'left'}
        open={showAudit}
        onClose={() => setShowAudit(false)}
      >
        <h3 style={{ textAlign: 'center', margin: 0 }}>Audit</h3>
        <Timeline position="alternate">
          {
            events.map((event) => (
              <TimelineItem>
                <TimelineOppositeContent
                  sx={{ m: 'auto 0' }}
                  align="right"
                  variant="body2"
                  color="text.success"
                >
                  <span style={{ fontSize: '12px'}}>{parseTime(event.timestamp)}</span>
                </TimelineOppositeContent>
                <TimelineSeparator>
                  <TimelineConnector />
                  {
                    event.action.result === "success"
                      ? iconMap[event.action.type].icon
                      : (
                        <TimelineDot color="error">
                          <Lock sx={{ color: 'white' }} />
                        </TimelineDot>
                      )
                  }
                  <TimelineConnector />
                </TimelineSeparator>
                <TimelineContent
                  sx={{ m: 'auto 0' }}
                  align="left"
                  variant="body1"
                  color="text.primary"
                >
                  <span style={{ fontSize: '14px'}}>{event.action.result === "success" ? iconMap[event.action.type].text(event) : 'Decrypt Failed'}</span>
                </TimelineContent>
              </TimelineItem>
            ))
          }
        </Timeline>
      </Drawer>
      <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: '100%' }}>
        {keycloak.authenticated && (
          <>
            <button
              type="button"
              className="btn btn__protect"
              onClick={() => setShowAudit(true)}
            >
              Audit
            </button>
            <div style={{ display: 'flex' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', paddingRight: '10px', }}>
                {keycloak.tokenParsed.preferred_username}
              </h3>
              <button
                className="btn btn__danger"
                onClick={() => keycloak.logout()}
              >
                Log out
              </button>
            </div>
          </>

        )}
        {!keycloak.authenticated && initialized && (
          <button
            type="button"
            className="btn btn__protect"
            onClick={() => keycloak.login()}
          >
            Login
          </button>
        )}
      </div>
      {
        keycloak.authenticated && (<Form addTask={addTask} attributes={attributes} setAttribute={setAttribute} attribute={attribute}/>)
      }
      <div className="filters btn-group stack-exception">
        {filterList}
        <select style={{textAlign: 'center'}} value={attribute} onChange={e => setAttribute(e.target.value)}>
          {attributes.map(attr => (
            <option key={attr} value={attr}>Team: {attr}</option>
          ))}
        </select>
      </div>
      <h2 id="list-heading" tabIndex="-1" ref={listHeadingRef}>
        {keycloak.authenticated ? headingText : "Please login"}
      </h2>
      {
        keycloak.authenticated && (<ul
          className="todo-list stack-large stack-exception"
          aria-labelledby="list-heading">
          {taskList}
        </ul>)
      }
    </div>
  );
}

export default App;
