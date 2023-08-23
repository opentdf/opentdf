import React, { useEffect, useRef, useState } from "react";


function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

export default function Todo(props) {
  const [isEditing, setEditing] = useState(false);
  const [newName, setNewName] = useState('');

  const editFieldRef = useRef(null);
  const editButtonRef = useRef(null);

  const wasEditing = usePrevious(isEditing);

  function handleChange(e) {
    setNewName(e.target.value);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!newName.trim()) {
      return;
    }
    props.editTask(props.id, newName);
    setNewName("");
    setEditing(false);
  }

  const editingTemplate = (
    <form className="stack-small" onSubmit={handleSubmit}>
      <div className="form-group">
        <label className="todo-label" htmlFor={props.id}>
          New name for {props.name}
        </label>
        <input
          id={props.id}
          className="todo-text"
          type="text"
          value={newName || props.name}
          onChange={handleChange}
          ref={editFieldRef}
        />
      </div>
      <div className="btn-group">

        <button
          type="button"
          className="btn todo-cancel"
          onClick={() => setEditing(false)}
        >
          Cancel
          <span className="visually-hidden">renaming {props.name}</span>
        </button>
        <button type="submit" className="btn btn__primary todo-edit">
          Save
          <span className="visually-hidden">new name for {props.name}</span>
        </button>
      </div>
    </form>
  );

  const viewTemplate = (
    <div className="stack-small">
      <div className="c-cb">
          <input
            id={props.id}
            type="checkbox"
            defaultChecked={props.completed}
            onChange={() => props.toggleTaskCompleted(props.id)}
            disabled={props.protected && !props.decryptedText}
          />
          <label className="todo-label" htmlFor={props.id}>
            {props.protected ? (
              props.decryptedText
                ? <span style={{ color: '#004987', textDecoration: 'underline' }}>{props.decryptedText} </span>
                : <span style={{ color: '#004987', textDecoration: 'underline' }}>Encrypted, by {props.owner} <br/>Task id is {props.tdfId}</span>
            ) : props.name}
          </label>
        </div>
        <div className="btn-group">
          {!props.protected && (
            <button
              type="button"
              className="btn"
              onClick={() => setEditing(true)}
              ref={editButtonRef}
            >
              Edit <span className="visually-hidden">{props.name}</span>
            </button>
          )}
          <button
            type="button"
            className="btn btn__danger"
            onClick={() => props.deleteTask(props.id)}
          >
            Delete <span className="visually-hidden">{props.name}</span>
          </button>
          {props.encryptTask && !props.protected && (
            <button
              type="button"
              className="btn btn__protect"
              onClick={() => props.encryptTask(props.id, props.name, props.team)}
            >
              Encrypt
            </button>
          )}
          {props.encryptTask && props.protected && !props.decryptedText && (
            <button
              type="button"
              className="btn btn__protect"
              onClick={() => props.decryptTask(props.id, props.name)}
            >
              Decrypt
            </button>
          )}
        </div>
    </div>
  );


  useEffect(() => {
    if (!wasEditing && isEditing) {
      editFieldRef.current.focus();
    }
    if (wasEditing && !isEditing) {
      editButtonRef.current.focus();
    }
  }, [wasEditing, isEditing]);


  return <li className="todo">{isEditing ? editingTemplate : viewTemplate}</li>;
}
