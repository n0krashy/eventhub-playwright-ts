import fs from 'node:fs';
import path from 'node:path';

export type Session = { email: string; userId: number; token: string };
export type Sessions = { primary: Session; secondary: Session };

const authFolder = path.resolve(process.cwd(), '.auth');
const sessionsFile = path.join(authFolder, 'sessions.json');

// Browser login state for the UI tests, created by tests/global.setup.ts
export const STORAGE_STATE_PATH = path.join(authFolder, 'primary.storage.json');

// The setup project saves the tokens here, and the tests read them back.
export function saveSessions(sessions: Sessions): void {
  fs.mkdirSync(authFolder, { recursive: true });
  fs.writeFileSync(sessionsFile, JSON.stringify(sessions, null, 2));
}

export function loadSessions(): Sessions {
  if (!fs.existsSync(sessionsFile)) {
    throw new Error('No saved sessions. Run the tests with `npx playwright test` so the "setup" project runs first.');
  }
  return JSON.parse(fs.readFileSync(sessionsFile, 'utf-8'));
}
