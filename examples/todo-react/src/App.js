import React, { useState, useRef, useEffect } from "react";
import Form from "./components/Form";
import FilterButton from "./components/FilterButton";
import Todo from "./components/Todo";
import { nanoid } from "nanoid";
import { useKeycloak } from '@react-keycloak/web';
import Login from './components/Login';


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
  const { keycloak, initialized } = useKeycloak();

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks.map(({ decryptedText, ...task }) => task )));
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
      <Login keycloak={keycloak} initialized={initialized}/>

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
