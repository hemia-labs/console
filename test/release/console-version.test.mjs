import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { consoleChangeset, isConsoleVersionBatch, retryReleaseTag } from '../../scripts/console-version.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const note = '---\n"api": major\n---\nInitial Console release.\n';
const files = ['apps/api/package.json', 'apps/web/package.json', 'apps/api/CHANGELOG.md', 'apps/web/CHANGELOG.md', 'bun.lock', '.changeset/console.md'];
const removed = [{ path: '.changeset/console.md', source: note }];
const before = { api: '0.1.0', web: '0.1.0' };
const after = { api: '1.0.0', web: '1.0.0' };

test('publishes only version-only merges that consumed Console changesets', () => {
  assert(isConsoleVersionBatch(before, after, files, removed));
  assert.equal(isConsoleVersionBatch(before, before, files, removed), false);
  assert.equal(isConsoleVersionBatch(before, after, [...files, 'apps/api/src/main.ts'], removed), false);
  assert.equal(isConsoleVersionBatch(before, after, files.slice(1), removed), false);
  assert.equal(isConsoleVersionBatch(before, after, files, []), false);
  assert.equal(consoleChangeset('---\n"@hemia/auth": patch\n---\nSDK'), false);
  assert.throws(() => isConsoleVersionBatch(after, before, files, removed), /must increase/);
  assert.throws(() => isConsoleVersionBatch(before, { ...after, web: '2.0.0' }, files, removed), /share a version/);
});

test('retry matches the exact committed stable version', () => {
  assert.equal(retryReleaseTag('console-v1.0.0', '1.0.0', '1.0.0'), 'console-v1.0.0');
  assert.throws(() => retryReleaseTag('console-v1.0.1', '1.0.0', '1.0.0'));
  assert.throws(() => retryReleaseTag('console-v1.0.0', '1.0.0', '1.0.1'));
});

test('real Changesets updates versions, lock and changelogs, then classifies the merge', () => {
  const dir = mkdtempSync(join(tmpdir(), 'console-version-'));
  try {
    for (const path of ['apps/api', 'apps/web', '.changeset', 'scripts', 'bin']) mkdirSync(join(dir, path), { recursive: true });
    for (const path of ['package.json','bun.lock','apps/api/package.json','apps/web/package.json','.changeset/config.json','scripts/console-version.mjs','scripts/version-console.mjs']) copyFileSync(join(root,path),join(dir,path));
    symlinkSync(join(root,'node_modules'),join(dir,'node_modules'),'dir');
    const git = (...args) => execFileSync('git',args,{cwd:dir,encoding:'utf8',stdio:'pipe'}).trim();
    git('init','-q','-b','main');
    writeFileSync(join(dir,'.changeset/console.md'),note);
    git('add','.');git('-c','user.name=Test','-c','user.email=test@example.com','commit','-qm','functional change');
    const base=git('rev-parse','HEAD');
    writeFileSync(join(dir,'bin/bun'),'#!/bin/sh\ntest "$*" = "install --frozen-lockfile"\n',{mode:0o755});
    execFileSync(process.execPath,[join(dir,'scripts/version-console.mjs')],{cwd:dir,env:{...process.env,PATH:`${join(dir,'bin')}:${process.env.PATH}`},stdio:'pipe'});
    const lock=readFileSync(join(dir,'bun.lock'),'utf8');
    for(const name of ['api','web']) {
      assert.equal(JSON.parse(readFileSync(join(dir,'apps',name,'package.json'))).version,'1.0.0');
      assert(lock.split(`"apps/${name}": {`)[1].split('}')[0].includes('"version": "1.0.0"'));
      assert(readFileSync(join(dir,'apps',name,'CHANGELOG.md'),'utf8').includes('## 1.0.0'));
    }
    const cli=(...args)=>execFileSync(process.execPath,[join(dir,'scripts/console-version.mjs'),...args],{cwd:dir,encoding:'utf8',stdio:'pipe'});
    assert(cli('pending').includes('false'));
    git('add','apps','.changeset','bun.lock');git('-c','user.name=Test','-c','user.email=test@example.com','commit','-qm','version');
    assert(cli('classify',base).includes('Console version-only merge: console-v1.0.0'));
    assert(cli('notes').includes('Initial Console release.'));
    assert(cli('retry','console-v1.0.0').includes('Explicit unpublished release retry'));
  } finally { rmSync(dir,{recursive:true,force:true}); }
});
