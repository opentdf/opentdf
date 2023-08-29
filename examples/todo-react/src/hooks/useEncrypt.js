import React, { useCallback } from "react";
import { Client } from '@opentdf/client';
import { getConfig, streamToUint8Arr, bufferToBase64 } from '../utils';

export default (keycloak) => {
  const CLIENT_CONFIG = getConfig(keycloak);

  return useCallback(async (name, team) => {
    const client = new Client.Client(CLIENT_CONFIG);
    const encryptParams = new Client.EncryptParamsBuilder()
      .withStringSource(name)
      .withOffline()
      .withAttributes([{ attribute: `https://todo.com/attr/${team}/value/developer` }])
      .build();

    const { stream } = await client.encrypt(encryptParams);
    const encryptedBuffer = await streamToUint8Arr(stream);
    const tdfId = await client.getPolicyId({ source: { type: 'buffer', location: encryptedBuffer }})
    const base64 = bufferToBase64(encryptedBuffer);

    return [base64, tdfId];
  }, [keycloak]);
};
