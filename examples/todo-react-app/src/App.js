import React, { useState, useRef, useEffect } from "react";
import Form from "./components/Form";
import FilterButton from "./components/FilterButton";
import Todo from "./components/Todo";
import { nanoid } from "nanoid";
import { useKeycloak } from '@react-keycloak/web';
import { Client } from '@opentdf/client';


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
  const [tasks, setTasks] = useState(localStorage.getItem('tasks') ? JSON.parse(localStorage.getItem('tasks')) : []);
  const [filter, setFilter] = useState("All");
  const { keycloak, initialized } = useKeycloak();
  const [encrypt, setEncrypt] = useState(null);
  const attribute = 'https://example.com/attr/AudienceGuidance/value/Restricted';

  const KAS_URL = 'http://localhost:65432/api/kas';

  useEffect(() => {
    if (initialized && keycloak.authenticated) {
      debugger;
      const CLIENT_CONFIG = {
        clientId: keycloak.clientId,
        organizationName: keycloak.realm,
        exchange: 'refresh',
        oidcOrigin: 'http://localhost:65432/auth/realms/tdf',
        refreshToken: keycloak.refreshToken,
        kasEndpoint: KAS_URL,
        dpopEnabled: true,
      };

      const protect = async (id) => {
        const client = new Client.Client(CLIENT_CONFIG);
        const updatedTasks = await Promise.all(tasks.map(async task => {
          if (task.id === id) {
            task.name = await client.encrypt(
              new Client.EncryptParamsBuilder()
                .withStringSource(task.name)
                .withAttributes([{ attribute }])
                .build()
            );
            task.protected = true;
          }
          return task;
        }));
        setTasks(updatedTasks);
      }

      setEncrypt(() => protect);
    }
  }, [initialized, keycloak.authenticated]);

  useEffect(() => {
    const tasksString = localStorage.getItem('tasks');
    const stateString = JSON.stringify(tasks);
    if (tasksString !== stateString) {
      localStorage.setItem('tasks', stateString)
    }
  }, [tasks]);


  function toggleTaskCompleted(id) {
    const updatedTasks = tasks.map((task) => {
      // if this task has the same ID as the edited task
      if (id === task.id) {
        // use object spread to make a new obkect
        // whose `completed` prop has been inverted
        return { ...task, completed: !task.completed };
      }
      return task;
    });
    setTasks(updatedTasks);
  }

  function deleteTask(id) {
    const remainingTasks = tasks.filter((task) => id !== task.id);
    setTasks(remainingTasks);
  }

  function editTask(id, newName) {
    const editedTaskList = tasks.map((task) => {
      // if this task has the same ID as the edited task
      if (id === task.id) {
        //
        return { ...task, name: newName };
      }
      return task;
    });
    setTasks(editedTaskList);
  }

  const taskList = tasks
    .filter(FILTER_MAP[filter])
    .map((task) => (
      <Todo
        id={task.id}
        name={task.name}
        completed={task.completed}
        protected={task.protected}
        key={task.id}
        toggleTaskCompleted={toggleTaskCompleted}
        deleteTask={deleteTask}
        encryptTask={encrypt}
        editTask={editTask}
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
    const newTask = { id: "todo-" + nanoid(), name: name, completed: false };
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

  return (
    <div className="todoapp stack-large">
      <div style={{ display: 'flex', justifyContent: 'right', maxWidth: '100%' }}>
        {keycloak.authenticated && (
          <>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', paddingRight: '10px', }}>
              {keycloak.tokenParsed.preferred_username}
            </h3>
            <button
              className="btn btn__danger"
              onClick={() => keycloak.logout()}
            >
              Log out
            </button>
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
      <Form addTask={addTask} />
      <div className="filters btn-group stack-exception">{filterList}</div>
      <h2 id="list-heading" tabIndex="-1" ref={listHeadingRef}>
        {headingText}
      </h2>
      <ul
        className="todo-list stack-large stack-exception"
        aria-labelledby="list-heading">
        {taskList}
      </ul>
    </div>
  );
}

export default App;
