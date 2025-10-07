// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// Import the installed JSON Resume theme
// Make sure TypeScript knows the type; if no types exist, use `any`
// @ts-ignore
const themeModule = require('jsonresume-theme-lumen');


const cats = {
  'Coding Cat': 'https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif',
  'Compiling Cat': 'https://media.giphy.com/media/mlvseq9yvZhba/giphy.gif'
};

export function activate(context: vscode.ExtensionContext) {
  vscode.window.showInformationMessage('JSON Resume Extension activated!');
  context.subscriptions.push(
    vscode.commands.registerCommand('catCoding.start', () => {
      // Create and show a new webview
      const panel = vscode.window.createWebviewPanel(
        'catCoding', // Identifies the type of the webview. Used internally
        'Cat Coding', // Title of the panel displayed to the user
        vscode.ViewColumn.One, // Editor column to show the new webview panel in.
        {} // Webview options. More on these later.
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

		// 1️⃣ Get JSON content from the current editor
		const resumeJSON = JSON.parse(document.getText());
	  	panel.webview.html = getWebviewContent(resumeJSON);
    })
  );
}

function getWebviewContent(resumeJSON: any) {
  const html = themeModule.render(resumeJSON);
  return html;
}
// This method is called when your extension is deactivated
export function deactivate() {}
