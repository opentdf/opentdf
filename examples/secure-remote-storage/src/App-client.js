import React, { useEffect, useState } from 'react';

import { useKeycloak } from '@react-keycloak/web';

import { Client, FileClient } from '@opentdf/client';

import { toWebReadableStream } from 'web-streams-node';

import './App.css';

// const oidcCredentials = {
// 	clientId, //*
// 	exchange: 'refresh', // client ?
// 	organizationName: realm, //*
// 	oidcRefreshToken: refreshToken, //*
// 	oidcOrigin: authority.replace('/auth/','')
// }



export default () => {
	const { keycloak, initialized } = useKeycloak();
	let fileClient;

	useEffect(() => {
		if (initialized) {
			const oidcCredentials = {
				clientId: keycloak.clientId,
				organizationName: keycloak.realm,
				exchange: 'refresh',
				oidcOrigin: keycloak.authServerUrl,
				oidcRefreshToken: keycloak.refreshToken,
				kasEndpoint: 'http://localhost:65432/api/kas',
			}
			fileClient = new FileClient(oidcCredentials)
		}
	}, [initialized, keycloak]);

	// // @ts-ignore
	async function protect(file) {
		// @ts-ignore
		const cipherStream = await fileClient.encrypt(await file.arrayBuffer());
		// @ts-ignore
		const decipherStream = await fileClient.decrypt(cipherStream);
		decipherStream.toFile('img.jpeg')
	}

	function inputHandler(e) {
		protect(e.target.files[0]);
	}

	return (
		<div>
			<input onChange={inputHandler} multiple={false} type="file" />
		</div>
	);
}
