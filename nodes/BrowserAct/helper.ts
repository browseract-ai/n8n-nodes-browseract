import { IExecuteFunctions, ILoadOptionsFunctions } from 'n8n-workflow';

export const BASE_URL = 'https://api.browseract.com';

export const BASE_URL_VERSION = '/v2';

const COMMON_HEADERS = { 'api-channel-ak': 'n8nak' };

export const BROWSER_ACT_API = 'browserActApi';

// 23 hours
export const QUERY_LIMIT = 16560;
export const QUERY_DELAY = 5000;

export async function browserActRequest(
	context: ILoadOptionsFunctions | IExecuteFunctions,
	{
		method,
		endpoint,
		body,
		qs,
	}: {
		method: 'GET' | 'POST' | 'PUT' | 'DELETE';
		endpoint: string;
		body?: any;
		qs?: any;
	},
) {
	return context.helpers.httpRequestWithAuthentication.call(context, 'browserActApi', {
		method,
		url: endpoint,
		baseURL: BASE_URL + BASE_URL_VERSION,
		headers: { ...COMMON_HEADERS },
		body,
		qs,
		json: true,
	});
}
