import React, { useState, useRef, useEffect } from "react";
import Form from "./components/Form";
import FilterButton from "./components/FilterButton";
import Todo from "./components/Todo";
import { nanoid } from "nanoid";
import { useKeycloak } from '@react-keycloak/web';
import Login from './components/Login';
import AuditSidebar from './components/AuditSidebar';
import { postEvent } from './utils';


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

function App() {
  const attributes = ['platform',   'saas'];
  const [attribute, setAttribute] = useState(attributes[0]);
  const [tasks, setTasks] = useState(JSON.parse(localStorage.getItem('tasks') || '[]'));
  const [filter, setFilter] = useState("All");
  const [showAudit, setShowAudit] = useState(false);
  const { keycloak, initialized } = useKeycloak();
  const [events, setEvents] = useState([]);

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
    localStorage.setItem('tasks', JSON.stringify(tasks.map(({ decryptedText, ...task }) => task )));
  }, [tasks]);


  function toggleTaskCompleted(id) {
    const updatedTasks = tasks.map((task) => {
      // if this task has the same ID as the edited task
      if (id === task.id) {
        postEvent({
          result: 'success',
          type: 'update',
          tdfId: task.tdfId || task.id,
          ownerId: task.owner,
          actorId: keycloak.tokenParsed.preferred_username,
          diff: { message: `"${task.tdfId || task.name}" completion status were set as ${!task.completed}`},
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
    postEvent({
      result: 'success',
      type: 'delete',
      tdfId: task.tdfId || task.name,
      ownerId: task.owner,
      actorId: keycloak.tokenParsed.preferred_username,
    })
    setTasks(tasks.filter((task) => id !== task.id));
  }

  function editTask(id, newName, props) {
    const editedTaskList = tasks.map((task) => {
      // if this task has the same ID as the edited task
      if (id === task.id) {
        return { ...task, name: newName, ...props };
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
        team={task.team}
        key={task.id}
        protected={task.protected}
        decryptedText={task.decryptedText}
        owner={task.owner}
        tdfId={task.tdfId}
        keycloak={keycloak}
        toggleTaskCompleted={toggleTaskCompleted}
        deleteTask={deleteTask}
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
    const newTask = { id: "todo-" + nanoid(), name: name, completed: false, team: attribute };
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
      <AuditSidebar showAudit={showAudit} setShowAudit={setShowAudit} events={events} />
      <header style={{display: 'flex', justifyContent: 'space-between', maxWidth: '100%'}}>
        <button
          type="button"
          className="btn btn__protect"
          onClick={() => setShowAudit(true)}
        >
          Audit
        </button>
        <Login keycloak={keycloak} initialized={initialized}/>
      </header>

      {keycloak.authenticated && (<Form addTask={addTask}/>)}
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
      {keycloak.authenticated && (
        <ul
          className="todo-list stack-large stack-exception"
          aria-labelledby="list-heading">
          {taskList}
        </ul>
      )}
    </div>
  );
}

export default App;
