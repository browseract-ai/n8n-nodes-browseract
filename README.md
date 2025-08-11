# n8n Nodes - BrowserAct Integration

This is an n8n community node that integrates [BrowserAct](https://www.browseract.com/) with your n8n workflows.

[BrowserAct](https://www.browseract.com/) is a platform for anyone to launch AI-powered crawling tasks with one click to automate web crawling, data extraction, and content generation—without coding. while [n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation tool that allows you to connect various services.

## Table of Contents

- [Installation](#installation)
- [Operations](#operations)
- [Credentials](#credentials)
- [Compatibility](#compatibility)
- [Resources](#resources)
- [Version History](#version-history)

## Installation

To install this community node, please follow the official [n8n community node installation guide](https://docs.n8n.io/integrations/community-nodes/installation/).

## Operations

This node supports a wide range of BrowserAct operations, including:

- **Run Agent**
  - Start the specified Agent crawler task to obtain the crawled web page data or structured results.
- **Run Workflow**
  - Execute the specified BrowserAct Workflow, supporting multi-step task orchestration and data processing.

## Credentials

To use a BrowserAct node, you need to complete the following steps:

1. Create a free account at [BrowserAct.com](https://browseract.com/).

2. Log in to BrowserAct and visit the "Integrations" page to create your API key.

3. In n8n, add your `BrowserActApi` to the node's Credentials configuration.

⚠️ **Note:** The API key is sensitive information. Please keep it secure and never share it publicly.

## Compatibility

This node has been tested with n8n version 1.0.0.

## Resources

- [n8n Community Nodes Documentation](https://docs.n8n.io/integrations/community-nodes/)
- [BrowserAct API Documentation](http://www.browseract.com/docs-api)

## Version History

### 1.0.0 (Initial Release)

- Basic Operation Support:
  - Supports the `Run Agent` action, which allows you to execute BrowserAct AI Agents.
  - Supports the `Run Workflow` action, which allows you to execute BrowserAct multi-step workflows.
  - Supports custom input parameters (such as prompt, workflow input, and timeout).
