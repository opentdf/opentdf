import React from 'react';
import { useKeycloak } from "@react-keycloak/web";
import { Avatar, Button, Spin } from "antd";
import { UserOutlined } from '@ant-design/icons';
import './UserStatus.css';

const UserStatus = () => {
  const { keycloak, initialized } = useKeycloak();

  return (
    <React.Fragment>
      {!initialized && (
        <>
          <Spin size="large" spinning={true} />
        </>
      )}
      {keycloak.authenticated && (
        <>
          <Avatar className='keycloak-avatar' size={32} icon={<UserOutlined />} />
          <Button
            onClick={() => keycloak.logout()}
            data-test-id="logout-button"
          >
            Log out
          </Button>
        </>
      )}
      {!keycloak.authenticated && initialized && (
        <Button
          type="primary"
          onClick={() => keycloak.login()}
          data-test-id="login-button"
        >
          Log in
        </Button>
      )}
    </React.Fragment>
  );
};

export default UserStatus;
