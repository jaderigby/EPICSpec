'use strict';
const vscode = require('vscode');
// Stable across upgrades; declining or dismissing also completes onboarding.
const promptKey = 'epic.defaultLanguagePromptShown';
async function offerDefaultLanguage(context) {
  if (context.globalState.get(promptKey, false)) return;
  await context.globalState.update(promptKey, true);
  const accept = 'Use EPIC';
  const choice = await vscode.window.showInformationMessage(
    'Use EPIC for new untitled files? This enables EPIC highlighting and Tab snippets before saving. It changes your VS Code default for new files; you can change Files: Default Language in Settings anytime.',
    accept, 'Keep Current Default'
  );
  if (choice !== accept) return;
  try {
    await vscode.workspace.getConfiguration('files').update('defaultLanguage', 'epic', vscode.ConfigurationTarget.Global);
  } catch (error) {
    vscode.window.showErrorMessage(`EPIC could not set the default language: ${error.message}. Set Files: Default Language to epic in Settings.`);
  }
}
module.exports = { offerDefaultLanguage };
