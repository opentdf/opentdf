import React, { useEffect, useRef, useState } from "react";
import useEncrypt from '../hooks/useEncrypt';
import useDecrypt from '../hooks/useDecrypt';
import { postEvent } from '../utils';

function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

const protectedStyles = { color: '#004987', textDecoration: 'underline' };

export default function Todo(props) {
  const [isEditing, setEditing] = useState(false);
  const [newName, setNewName] = useState('');

  const editFieldRef = useRef(null);
  const editButtonRef = useRef(null);

  const wasEditing = usePrevious(isEditing);
  const encrypt = useEncrypt(props.keycloak);
  const decrypt = useDecrypt(props.keycloak);

  function protect() {
    encrypt(props.name, props.team)
      .then(([encryptedName, tdfId]) => {
        props.editTask(
          props.id, encryptedName, { protected: true, owner: props.keycloak.tokenParsed.preferred_username, tdfId }
        );
        return tdfId;
      })
      .then((tdfId) => postEvent({
          result: 'success',
          type: 'create',
          tdfId,
          ownerId: props.keycloak.tokenParsed.preferred_username
        })
      )
  }

  function showDecryption() {
    decrypt(props.name)
      .then((decryptedText) => {
        props.editTask(
          props.id, props.name, { decryptedText }
        );
      })
      .then(() => postEvent({
          result: 'success',
          type: 'read',
          tdfId: props.tdfId,
          ownerId: props.owner,
          actorId: props.keycloak.tokenParsed.preferred_username,
        })
      )
      .catch((e) => {
          alert('Failed to decrypt');
          postEvent({
            result: 'failure',
            type: 'read',
            tdfId: props.tdfId,
            ownerId: props.owner,
            actorId: props.keycloak.tokenParsed.preferred_username,
            eventMetaData: {message: e.message}
          })
        }
      )
  }

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
          />
          <label className="todo-label" htmlFor={props.id}>
            {!props.protected && props.name}
            {props.protected && (
              <span style={protectedStyles}>{props.decryptedText || `Encrypted by ${props.owner}, Task id is ${props.tdfId}`}</span>
            )}
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
          {!props.protected && (
            <button
              type="button"
              className="btn btn__protect"
              onClick={protect}
            >
              Encrypt
            </button>
          )}
          {props.protected && !props.decryptedText && (
            <button
              type="button"
              className="btn btn__protect"
              onClick={showDecryption}
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
