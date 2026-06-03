#!/usr/bin/env node
// Bumps app.json version (patch) and buildNumber, then prints both for confirmation.
// Usage: node scripts/bump-version.js [patch|minor|major]

const fs = require('fs');
const path = require('path');

const appJsonPath = path.resolve(__dirname, '../app.json');
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

const bumpType = process.argv[2] ?? 'patch';
const [major, minor, patch] = appJson.expo.version.split('.').map(Number);

let nextVersion;
if (bumpType === 'major') nextVersion = `${major + 1}.0.0`;
else if (bumpType === 'minor') nextVersion = `${major}.${minor + 1}.0`;
else nextVersion = `${major}.${minor}.${patch + 1}`;

const nextBuild = String(Number(appJson.expo.ios.buildNumber) + 1);

appJson.expo.version = nextVersion;
appJson.expo.ios.buildNumber = nextBuild;

fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');

console.log(`version  ${appJson.expo.version.replace(nextVersion, `${major}.${minor}.${patch}`)} → ${nextVersion}`);
console.log(`build    ${Number(nextBuild) - 1} → ${nextBuild}`);
