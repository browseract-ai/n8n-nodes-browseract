import {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	JsonObject,
	NodeApiError,
	NodeConnectionType,
	NodeOperationError,
	ResourceMapperFields,
	sleep,
} from 'n8n-workflow';
import { BROWSER_ACT_API, browserActRequest, QUERY_DELAY, QUERY_LIMIT } from './helper';

export class BrowserAct implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'BrowserAct',
		name: 'browserAct',
		icon: 'file:browserAct.svg',
		group: ['action'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'browserAct description',
		defaults: {
			name: 'BrowserAct default name',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				displayName: 'BrowserAct API Key',
				name: BROWSER_ACT_API,
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Agent', value: 'agent' },
					{ name: 'Workflow', value: 'workflow' },
				],
				default: 'agent',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [{ name: 'Run an Agent', value: 'runAgent', action: 'Run an agent' }],
				default: 'runAgent',
				displayOptions: {
					show: {
						resource: ['agent'],
					},
				},
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [{ name: 'Run a Workflow', value: 'runWorkflow', action: 'Run a workflow' }],
				default: 'runWorkflow',
				displayOptions: {
					show: {
						resource: ['workflow'],
					},
				},
			},
			{
				// eslint-disable-next-line n8n-nodes-base/node-param-display-name-wrong-for-dynamic-options
				displayName: 'Workflow',
				name: 'workflowId',
				type: 'options',
				typeOptions: { loadOptionsMethod: 'getWorkflows' },
				required: true,
				default: '',
				description:
					'Select a workflow to run. Choose from the list, or specify an ID using an expression. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
				displayOptions: {
					show: {
						operation: ['runWorkflow'],
					},
				},
			},
			{
				displayName: 'Workflow Inputs',
				name: 'workflowConfig',
				type: 'resourceMapper',
				noDataExpression: true,
				default: {
					mappingMode: 'defineBelow',
					value: null,
				},
				required: true,
				typeOptions: {
					loadOptionsDependsOn: ['workflowId'],
					resourceMapper: {
						resourceMapperMethod: 'getWorkflowInputs',
						mode: 'update',
						addAllFields: false,
					},
				},
				displayOptions: {
					show: {
						operation: ['runWorkflow'],
					},
				},
			},
			{
				// eslint-disable-next-line n8n-nodes-base/node-param-display-name-wrong-for-dynamic-options
				displayName: 'Agent',
				name: 'agentId',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getAgents',
					allowManualInput: true,
				},
				required: true,
				default: '',
				description:
					'Select an agent from the list or enter an ID manually. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
				displayOptions: {
					show: {
						operation: ['runAgent'],
					},
				},
			},
			{
				displayName: 'Task',
				name: 'task',
				type: 'string',
				required: true,
				default: '',
				description: 'Use natural language to describe the task you want the Agent to perform',
				displayOptions: {
					show: {
						operation: ['runAgent'],
					},
				},
			},
			{
				displayName: 'Timeout',
				name: 'timeout',
				type: 'number',
				required: true,
				default: 3600,
				description: 'Timeout for the run, in seconds (default: 3600)',
			},
		],
	};

	methods = {
		resourceMapping: {
			getWorkflowInputs: async function (
				this: ILoadOptionsFunctions,
			): Promise<ResourceMapperFields> {
				const workflowId = this.getNodeParameter('workflowId', 0) as string;

				const response = await browserActRequest(this, {
					method: 'GET',
					endpoint: `/workflow/get-workflow?workflow_id=${workflowId}`,
				});

				const common = {
					type: 'string',
					display: true,
					defaultMatch: true,
				};

				const inputParameters = (response?.input_parameters || []).map((item: any) => {
					const { name, default_enabled } = item || {};

					const required = !default_enabled;

					return {
						...common,
						id: `input-${name}`,
						displayName: required ? `* ${name}` : name,
						required,
						description: required
							? `${name} is required`
							: 'If left blank, the default value defined in BrowserAct will be used.',
					};
				});
				// const credentials = (properties?.credentials?.value || []).reduce(
				// 	(acc: any[], item: any) => {
				// 		const { platform } = item || {};
				// 		return [
				// 			{
				// 				...common,
				// 				id: `password-${platform}`,
				// 				displayName: `Password: ${platform}`,
				// 				type: 'string',
				// 			},
				// 			{
				// 				...common,
				// 				id: `account-${platform}`,
				// 				displayName: `Account: ${platform}`,
				// 				type: 'string',
				// 			},
				// 			...acc,
				// 		];
				// 	},
				// 	[],
				// );

				return {
					fields: [...inputParameters],
				};
			},
		},
		loadOptions: {
			async getWorkflows(this: ILoadOptionsFunctions) {
				const response = await browserActRequest(this, {
					method: 'GET',
					endpoint: '/workflow/list-workflows',
					qs: {
						page: 1,
						perPage: 500,
					},
				});

				const workflows = response.items || [];

				return workflows.map((workflow: any) => ({
					name: workflow.name,
					value: workflow.id,
				}));
			},

			async getAgents(this: ILoadOptionsFunctions) {
				const response = await browserActRequest(this, {
					method: 'GET',
					endpoint: '/agent/list-agents',
					qs: {
						page: 1,
						perPage: 500,
					},
				});

				const agents = response.items;

				if (!Array.isArray(agents)) {
					throw new NodeApiError(this.getNode(), response as unknown as JsonObject);
				}

				return agents.map((agent) => {
					return {
						name: agent.name,
						value: agent.id,
					};
				});
			},
		},
	};

	async execute(this: IExecuteFunctions) {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		for (let i = 0; i < items.length; i++) {
			const resource = this.getNodeParameter('resource', i) as string;
			const operation = this.getNodeParameter('operation', i) as string;

			const timeout = Number(this.getNodeParameter('timeout', i) as number) || 3600;
			const limit = Math.min(Math.ceil((timeout * 1000) / QUERY_DELAY), QUERY_LIMIT);

			if (timeout < 0) {
				throw new NodeOperationError(this.getNode(), 'Timeout needs to be greater than 0', {
					itemIndex: i,
				});
			}

			let runTaskBody: any = {};
			let endpointType = 'agent';

			if (resource === 'workflow' && operation === 'runWorkflow') {
				const workflowId = this.getNodeParameter('workflowId', i) as any;
				const workflowConfig = this.getNodeParameter('workflowConfig', i) as any;

				if (workflowConfig?.value == null) {
					throw new NodeOperationError(this.getNode(), 'Please select a workflow to run', {
						itemIndex: i,
					});
				}

				const missingFields: string[] = [];

				const input_parameters: { name: string; value: string }[] = [];
				// const credentialsMap: any = {};

				workflowConfig?.schema?.forEach((item: any) => {
					const value = workflowConfig.value[item.id]?.trim();

					if (value) {
						// if (item.id.startsWith('account-')) {
						// 	const key = item.id.replace('account-', '');

						// 	if (!credentialsMap[key]) {
						// 		credentialsMap[key] = {};
						// 	}
						// 	credentialsMap[key]['account'] = value;
						// }
						// if (item.id.startsWith('password-')) {
						// 	const key = item.id.replace('password-', '');

						// 	if (!credentialsMap[key]) {
						// 		credentialsMap[key] = {};
						// 	}
						// 	credentialsMap[key]['password'] = value;
						// }
						if (item.id.startsWith('input-')) {
							input_parameters.push({
								name: item.id.replace('input-', ''),
								value,
							});
						}
					}

					if (item.required && !value) {
						missingFields.push(item.displayName);
					}
				});

				if (missingFields.length) {
					throw new NodeOperationError(
						this.getNode(),
						`Please fill in the required fields: ${missingFields.join(', ')}`,
					);
				}
				runTaskBody = {
					workflow_id: workflowId,
					input_parameters,
					// credentials: Object.entries(credentialsMap).map(([platform, info]) => ({
					// 	platform,
					// 	account: (info as any)?.account,
					// 	password: (info as any)?.password,
					// })),
				};

				endpointType = 'workflow';
			}

			if (resource === 'agent' && operation === 'runAgent') {
				const agentId = this.getNodeParameter('agentId', i) as string;
				const task = this.getNodeParameter('task', i) as string;

				runTaskBody = {
					task,
					agent_id: agentId,
				};
			}

			const response = await browserActRequest(this, {
				method: 'POST',
				endpoint: `/${endpointType}/run-task`,
				body: runTaskBody,
			});

			const taskId = response.id;

			if (!taskId) continue;

			let taskDetail: any = null;
			let needStop = true;

			for (let j = 0; j < limit; j++) {
				await sleep(QUERY_DELAY);

				const detail = await browserActRequest(this, {
					method: 'GET',
					endpoint: `/${endpointType}/get-task?task_id=${taskId}`,
				});

				if (['finished', 'canceled', 'paused', 'failed'].includes(detail.status)) {
					taskDetail = detail;
					needStop = false;
					break;
				}
			}

			if (needStop) {
				await browserActRequest(this, {
					method: 'PUT',
					endpoint: `/${endpointType}/stop-task?task_id=${taskId}`,
				});

				taskDetail = await browserActRequest(this, {
					method: 'GET',
					endpoint: `/${endpointType}/get-task?task_id=${taskId}`,
				});
			}

			if (taskDetail) {
				returnData.push({ json: taskDetail });
			} else {
				returnData.push({ json: { error: 'Error', taskId } });
			}

			return [returnData];
		}

		return [returnData];
	}
}
