// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import Ajv from "ajv";

// Import the installed JSON Resume theme
// Make sure TypeScript knows the type; if no types exist, use `any`
// @ts-ignore
const themeModule = require('jsonresume-theme-lumen');

export function activate(context: vscode.ExtensionContext) {
  vscode.window.showInformationMessage('JSON Resume Extension activated!');
  context.subscriptions.push(
    vscode.commands.registerCommand('jsonresume.preview', async () => {
      // Create and show a new webview
      const panel = vscode.window.createWebviewPanel(
        'jsonresume', // Identifies the type of the webview. Used internally
        'Resume Preview', // Title of the panel displayed to the user
        vscode.ViewColumn.Beside, // Editor column to show the new webview panel in.
        {
          enableScripts: true,
        } // Webview options. Required for interactivity
      );

      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor found.');
        return;
      }

      const document = editor.document;
      if (document.languageId !== 'json') {
        vscode.window.showErrorMessage('Active file is not a JSON file.');
        return;
      }

      // Setup the validation against the custom schema
      const ajv = new Ajv({
        allErrors: true, // continue collecting all validation issues
        jsonPointers: true, // required for Ajv v6 path syntax
      });

      // Async function to load schema from GitHub
      const fetch = await import("node-fetch").then(mod => mod.default);
      async function loadSchema(url: string) {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch schema: ${response.status} ${response.statusText}`);
        }
        const schema = (await response.json()) as object;
        return ajv.compile(schema); // returns validate function
      }

      // 3️⃣ Load the schema and compile validator
      let validate;
      try {
        validate = await loadSchema(
          "https://raw.githubusercontent.com/jhong16/jsonresume-theme-lumen/main/schema.json"
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        panel.webview.html = renderErrorPage("❌ Failed to load schema", message);
        return;
      }

      // Helper to update the preview
      const updateWebview = () => {
        try {
          const resumeJSON = JSON.parse(document.getText());

            // Validate against schema
          const valid = validate(resumeJSON);
          if (!valid) {
            panel.webview.html = renderValidationErrors(validate.errors);
            return;
          }

          // Render if valid
          panel.webview.html = getWebviewContent(resumeJSON);
        } catch (err: unknown) {
          let message = 'Unknown error';
          if (err instanceof Error) {
            message = err.message;
          } else if (typeof err === 'string') {
            message = err;
          }
          panel.webview.html = renderErrorPage('❌ Invalid JSON', message);
        }
      };


      // Initial render
      updateWebview();

      // 🔄 Watch for text changes in the current document
      let timeout: NodeJS.Timeout | undefined;
      const changeDocSub = vscode.workspace.onDidChangeTextDocument((e) => {
        if (e.document === document) {
          clearTimeout(timeout);
          timeout = setTimeout(updateWebview, 250);
        }
      });


      // 🧹 Clean up when the panel is closed
      panel.onDidDispose(() => {
        changeDocSub.dispose();
      });
    })
  );
}

function getWebviewContent(resumeJSON: any) {
  const html = themeModule.render(resumeJSON);
  return html;
}

const renderValidationErrors = (errors: Ajv.ErrorObject[] | null | undefined) => `
  <html>
    <body style="font-family: monospace; background: #1e1e1e; color: #ffcc00; padding: 1rem;">
      <h2>⚠️ Schema validation failed</h2>
      <ul>
        ${errors?.map(err => `
          <li><b>${err.dataPath || '/'}</b>: ${err.message}</li>
        `).join("")}
      </ul>
    </body>
  </html>
`;

function renderErrorPage(title: string, message: string) {
  return `
    <html>
      <body style="font-family: monospace; background: #ecececff; color: #ff5555; padding: 1rem;">
        <h2>${title}</h2>
        <pre style="white-space: pre-wrap;">${message}</pre>
      </body>
    </html>
  `;
}


// This method is called when your extension is deactivated
export function deactivate() {}
