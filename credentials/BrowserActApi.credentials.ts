import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';
import { BASE_URL } from '../nodes/BrowserAct/helper';

export class BrowserActApi implements ICredentialType {
	name = 'browserActApi';

	displayName = 'BrowserAct API';

	documentationUrl = 'https://www-test03.browseract.com/docs-api';

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

	test: ICredentialTestRequest = {
		request: {
			baseURL: BASE_URL,
			url: '/',
		},
	};
}
