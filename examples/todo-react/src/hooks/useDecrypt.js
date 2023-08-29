import React, { useCallback } from "react";
import { Client } from '@opentdf/client';
import { getConfig, base64ToUint8Arr } from '../utils';

export default (keycloak) => {
  const CLIENT_CONFIG = getConfig(keycloak);

  return useCallback(async (name) => {
    const client = new Client.Client(CLIENT_CONFIG);
    const { buffer } = base64ToUint8Arr(name);
    const decryptParams = new Client.DecryptParamsBuilder()
      .withArrayBufferSource(buffer)
      .build();

    const decryptedStream = await client.decrypt(decryptParams);
    const decryptedText = await decryptedStream.toString();

    return decryptedText;
  }, [keycloak]);
};
