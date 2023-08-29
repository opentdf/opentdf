export const getConfig = ({ clientId, realm: organizationName, refreshToken }) => ({
  clientId,
  organizationName,
  exchange: 'refresh',
  oidcOrigin: 'http://localhost:65432/auth/realms/tdf',
  refreshToken,
  kasEndpoint: 'http://localhost:65432/api/kas',
})

export const streamToUint8Arr = async (stream) => new Uint8Array(await new Response(stream).arrayBuffer());
export const bufferToBase64 = (buffer) => window.btoa([...buffer].map(byte => String.fromCharCode(byte)).join(''));
export const base64ToUint8Arr = (name) => Uint8Array.from(atob(name).split(''), char => char.charCodeAt(0));

export const postEvent = async ({ result, type, attributes, tdfId, ownerId, actorId, eventMetaData, diff }) => {
  await fetch(
    'http://localhost:8080/api/v1/write',
    {
      method: 'POST',
      body: JSON.stringify([
        {
          "message": JSON.stringify({
            "action": {
              result, // [ success, failure, error ]
              type // [ create, update, delete, read ]
            },
            "clientInfo": {
              "platform": "todo-react-client",
            },
            "object": {
              ...(attributes ? {attributes} : {}),
              "id": tdfId,
              "name": "todo",
              "type": "data_object"
            },
            "owner": {
              "id": ownerId,
              "orgId": "194cf2de-2613-42bd-a33f-a3f3a49a6e31"
            },
            ...(actorId ? {'actor': {id: actorId}} : {}),
            ...(eventMetaData ? {eventMetaData} : {}),
            ...(diff ? {diff} : {}),
            "timestamp": new Date().toISOString()
          })
        }
      ])
    }
  );
}
