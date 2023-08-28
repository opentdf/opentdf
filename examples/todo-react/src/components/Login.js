import React from "react";

export default ({ keycloak, initialized }) => (
  <div style={{ display: 'flex', justifyContent: 'right', maxWidth: '100%' }}>
    {keycloak.authenticated && (
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
)
