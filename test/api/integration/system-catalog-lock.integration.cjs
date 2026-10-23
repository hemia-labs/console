const assert = require('node:assert/strict');
const path = require('node:path');
const { createRequire } = require('node:module');
const api = path.resolve(__dirname, '../../../apps/api');
const requireApi = createRequire(path.join(api, 'package.json'));
requireApi('ts-node').register({ project: path.join(api, 'tsconfig.json'), transpileOnly: true });
const Redis = requireApi('ioredis');
const { SystemCatalogLock } = require(path.join(api, 'src/modules/legal-system-catalog/system-catalog.lock.ts'));
const port = Number(process.env.SYSTEM_LOCK_TEST_PORT);
assert(Number.isInteger(port) && port > 0, 'Use a disposable Redis port');
const key = 'console:system-catalog:write:v1';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
(async () => {
 const redis = new Redis({ host:'127.0.0.1',port, enableOfflineQueue:false, retryStrategy:()=>null });
 await new Promise((resolve,reject) => { redis.once('ready',resolve); redis.once('error',reject); });
 try {
  const a = new SystemCatalogLock(redis), b = new SystemCatalogLock(redis);
  let value = 0;
  const save = lock => lock.run(async assertHeld => { const previous = value; await sleep(25); await assertHeld(); value=previous+1; });
  await Promise.all([save(a),save(b)]);
  assert.equal(value,2); assert.equal(await redis.exists(key),0);
  await a.run(async assertHeld => { await sleep(11_000); assert((await redis.pttl(key))>25_000,'Background renewal must extend the lease'); await assertHeld(); });
  let mutated=false;
  await assert.rejects(a.run(async assertHeld => {
   await redis.pexpire(key,1); await sleep(15);
   await redis.set(key,'successor','PX',30_000,'NX');
   await assertHeld(); mutated=true;
  }),error=>error.status===503);
  assert.equal(mutated,false); assert.equal(await redis.get(key),'successor');
  await redis.del(key);
  console.log('PASS two instances serialize saves, real Redis renewal, expired lease blocks mutation and release preserves successor');
 } finally { await redis.quit(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
