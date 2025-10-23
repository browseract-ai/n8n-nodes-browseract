import {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
	NodeOperationError,
	ResourceMapperFields,
	sleep,
} from 'n8n-workflow';
import {
	BROWSER_ACT_API,
	browserActRequest,
	isTemplateTask,
	QUERY_DELAY,
	QUERY_LIMIT,
	TASK_TYPE,
	TASK_TYPE_DEFAULT_VALUE,
} from './helper';
import { Template } from './types';

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
				options: [{ name: 'Workflow', value: 'workflow' }],
				default: 'workflow',
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
				displayName: 'Search Workflows From',
				name: 'type',
				type: 'options',
				description: 'Choose where to load workflows from',
				options: [
					{ name: 'Template Marketplace', value: TASK_TYPE.TEMPLATE },
					{ name: 'My Workflows', value: TASK_TYPE.WORKFLOW },
				],
				required: true,
				default: TASK_TYPE_DEFAULT_VALUE,
				displayOptions: {
					show: {
						operation: ['runWorkflow'],
					},
				},
			},
			{
				// eslint-disable-next-line n8n-nodes-base/node-param-display-name-wrong-for-dynamic-options
				displayName: 'Workflow',
				name: 'templateId',
				type: 'options',
				typeOptions: { loadOptionsMethod: 'getTemplateWorkflows' },
				required: true,
				default: '',
				description:
					'Select a workflow to run. Choose from the list, or specify an ID using an expression. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
				displayOptions: {
					show: {
						operation: ['runWorkflow'],
						type: [TASK_TYPE.TEMPLATE],
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
						type: [TASK_TYPE.WORKFLOW],
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
					loadOptionsDependsOn: ['workflowId', 'templateId'],
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
				displayName: 'Incognito Mode',
				name: 'open_incognito_mode',
				type: 'boolean',
				default: false,
				// eslint-disable-next-line n8n-nodes-base/node-param-description-boolean-without-whether
				description:
					'The workflow will use the browser when running tasks. When using Incognito mode, the browser data and account login status will not be saved; when not using Incognito mode, the browser data and account login status will be shared.',
				displayOptions: {
					show: {
						operation: ['runWorkflow'],
						type: [TASK_TYPE.WORKFLOW],
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
				try {
					const type = this.getNodeParameter('type', 0) as string;
					const workflowId = this.getNodeParameter('workflowId', 0) as string;
					const templateId = this.getNodeParameter('templateId', 0) as string;

					if (isTemplateTask(type) && !templateId) {
						throw new NodeOperationError(this.getNode(), 'Please select a template workflow!');
					} else if (!isTemplateTask(type) && !workflowId) {
						throw new NodeOperationError(this.getNode(), 'Please select a workflow!');
					}

					const response = await browserActRequest(this, {
						method: 'GET',
						endpoint: isTemplateTask(type)
							? `/workflow/get-official-workflow-template?workflow_template_id=${templateId}`
							: `/workflow/get-workflow?workflow_id=${workflowId}`,
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
					return {
						fields: [...inputParameters],
					};
				} catch (error) {
					return { fields: [] };
				}
			},
		},
		loadOptions: {
			async getWorkflows(this: ILoadOptionsFunctions) {
				const response = await browserActRequest(this, {
					method: 'GET',
					endpoint: '/workflow/list-workflows',
					qs: {
						page: 1,
						limit: 500,
					},
				});

				const workflows = response.items || [];

				return workflows.map((workflow: any) => ({
					name: workflow.name,
					value: workflow.id,
				}));
			},
			async getTemplateWorkflows(this: ILoadOptionsFunctions) {
				const response = await browserActRequest(this, {
					method: 'GET',
					endpoint: '/workflow/list-official-workflow-templates',
					qs: {
						page: 1,
						limit: 500,
					},
				});

				const templates: Template[] = response.items || [];

				return templates.map((template) => ({
					name: template.name,
					value: template.templateId,
				}));
			},
		},
	};

	async execute(this: IExecuteFunctions) {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;

				const timeout = Number(this.getNodeParameter('timeout', i) as number) || 3600;
				const limit = Math.min(Math.ceil((timeout * 1000) / QUERY_DELAY), QUERY_LIMIT);

				const type = this.getNodeParameter('type', i) as string;

				if (timeout < 0) {
					throw new NodeOperationError(this.getNode(), 'Timeout needs to be greater than 0', {
						itemIndex: i,
					});
				}

				let runTaskBody: any = {};
				let endpointType = 'workflow';

				if (resource === 'workflow' && operation === 'runWorkflow') {
					if (isTemplateTask(type)) {
						runTaskBody.workflow_template_id = this.getNodeParameter('templateId', i) as string;
					} else {
						runTaskBody.workflow_id = this.getNodeParameter('workflowId', i) as string;
						runTaskBody.open_incognito_mode =
							this.getNodeParameter('open_incognito_mode', i) || false;
					}

					const workflowConfig = this.getNodeParameter('workflowConfig', i) as any;

					if (workflowConfig?.value == null) {
						throw new NodeOperationError(this.getNode(), 'Please select a workflow to run', {
							itemIndex: i,
						});
					}

					const missingFields: string[] = [];

					const input_parameters: { name: string; value: string }[] = [];

					workflowConfig?.schema?.forEach((item: any) => {
						const value = workflowConfig.value[item.id]?.trim();

						if (value) {
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

					runTaskBody.input_parameters = input_parameters;
				}

				const response = await browserActRequest(this, {
					method: 'POST',
					endpoint: isTemplateTask(type)
						? `/${endpointType}/run-task-by-template`
						: `/${endpointType}/run-task`,
					body: runTaskBody,
				});

				const taskId = response.id;

				if (!taskId) {
					// push failure for this item
					returnData.push({
						json: { error: 'No task id returned', taskId },
						pairedItem: { item: i },
					});
					continue;
				}

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
					returnData.push({ json: taskDetail, pairedItem: { item: i } });
				} else {
					returnData.push({ json: { error: 'Error', taskId }, pairedItem: { item: i } });
				}
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : String(error);

				if (this.continueOnFail && this.continueOnFail()) {
					returnData.push({
						json: {
							error: errorMessage,
						},
						pairedItem: { item: i },
					});
					continue;
				}

				throw error;
			}
		}

		return [returnData];
	}
}
