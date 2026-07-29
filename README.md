# n8n Nodes - BrowserAct

This is an n8n community node that integrates [BrowserAct](https://www.browseract.com/) with n8n.

BrowserAct lets teams run hosted browser automation bots for web crawling, data extraction, and content generation. This node starts a BrowserAct Bot from an n8n workflow, waits for completion, and returns the task result to downstream n8n nodes.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

## Installation

Follow the official [n8n community node installation guide](https://docs.n8n.io/integrations/community-nodes/installation/).

Use this package name when installing:

```text
n8n-nodes-browseract
```

## Operations

### Bot

The BrowserAct node supports one operation:

- **Run a Bot**: run a selected BrowserAct Bot and return its final task details.

You can run either:

- **Template Marketplace** bots: official BrowserAct templates available to your account.
- **My Bots (With Published Version Only)**: BrowserAct Bots from your account that have a published version.

## Credentials

To use this node, create a BrowserAct API key and add it to n8n.

1. Create or log in to your BrowserAct account at [BrowserAct.com](https://browseract.com/).
2. Open the BrowserAct **Integrations** page.
3. Create an API key.
4. In n8n, create a new credential of type **BrowserAct API**.
5. Paste the API key into the **BrowserAct API Key** field.

Keep the API key private. Anyone with the key can make requests against your BrowserAct account.

## Compatibility

This package requires Node.js 20.15 or later.

It is built for n8n community nodes using the n8n nodes API version 1. The package declares `n8n-workflow` as a peer dependency so it can use the version provided by your n8n installation.

## Usage

Add the **BrowserAct** node to an n8n workflow and choose **Bot** as the resource.

### Run a marketplace template

1. Set **Operation** to **Run a Bot**.
2. Set **Search Bots From** to **Template Marketplace**.
3. Select a **Bot** from the loaded list, or use an expression with a template ID.
4. Fill in the required **Bot Inputs**.
5. Select a **Proxy Region**.
6. Set **Timeout** in seconds.
7. Execute the workflow.

### Run one of your published bots

1. Set **Operation** to **Run a Bot**.
2. Set **Search Bots From** to **My Bots (With Published Version Only)**.
3. Select a **Bot** from the loaded list, or use an expression with a bot ID.
4. Fill in the required **Bot Inputs**.
5. Set **Timeout** in seconds.
6. Execute the workflow.

### Bot inputs

The node loads input fields from BrowserAct after you select a bot. Required inputs are marked in n8n. Optional inputs can be left blank to use the default values configured in BrowserAct.

### Results

After starting a task, the node polls BrowserAct until the task finishes, fails, is canceled, or reaches the configured timeout.

The output item contains the BrowserAct task details returned by the API, including task status and result data when available. If the timeout is reached, the node asks BrowserAct to stop the task and then returns the latest task detail.

## Resources

- [BrowserAct](https://www.browseract.com/)
- [BrowserAct API Documentation](https://www.browseract.com/docs-api)
- [n8n Community Nodes Documentation](https://docs.n8n.io/integrations/community-nodes/)
- [n8n Community Node Installation](https://docs.n8n.io/integrations/community-nodes/installation/)

## Version History

- **1.3.2**: Updates n8n Codex metadata, expands README usage documentation, and adds GitHub Actions publishing with npm provenance.
- **1.3.1**: Adds BrowserAct Bot execution support for template marketplace bots and published account bots.
