import type { IAuthenticateGeneric, ICredentialType, INodeProperties } from 'n8n-workflow';

export class BrowserActApi implements ICredentialType {
	name = 'browserActApi';

	displayName = 'BrowserAct API';

	documentationUrl = 'https://www.browseract.com/';

	properties: INodeProperties[] = [
		{
			displayName: 'BrowserAct API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};
}
