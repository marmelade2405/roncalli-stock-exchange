import {expect,it,vi,beforeEach} from 'vitest';
import {mkdtemp,mkdir,readFile,readdir,writeFile,rename} from 'node:fs/promises';
import {join} from 'node:path';
import {writeAtomic} from '../../src/server/atomic-file.js';
vi.mock('node:fs/promises',async original=>{const actual=await original<typeof import('node:fs/promises')>();return{...actual,rename:vi.fn(actual.rename)};});
beforeEach(async()=>{const actual=await vi.importActual<typeof import('node:fs/promises')>('node:fs/promises');vi.mocked(rename).mockReset().mockImplementation(actual.rename);});
async function directory(){const base=join(process.cwd(),'.superpowers/sdd/2026-10-08-stock-market-exchange-events/tests');await mkdir(base,{recursive:true});return mkdtemp(join(base,'atomic-'));}
it('atomic_replace_retries_transient_file_locks_without_deleting_previous_state',async()=>{
  const dir=await directory(),path=join(dir,'market.json');await writeFile(path,'old');
  vi.mocked(rename).mockImplementationOnce(async()=>{expect(await readFile(path,'utf8')).toBe('old');throw Object.assign(Error('locked'),{code:'EPERM'});}).mockRejectedValueOnce(Object.assign(Error('busy'),{code:'EBUSY'}));
  await writeAtomic(path,'new');expect(await readFile(path,'utf8')).toBe('new');expect(rename).toHaveBeenCalledTimes(3);expect(await readdir(dir)).toEqual(['market.json']);
});
it('atomic_replace_keeps_old_state_and_cleans_temp_on_permanent_failure',async()=>{
  const dir=await directory(),path=join(dir,'market.json');await writeFile(path,'old');vi.mocked(rename).mockRejectedValue(Object.assign(Error('disk failure'),{code:'EIO'}));
  await expect(writeAtomic(path,'new')).rejects.toThrow('disk failure');expect(await readFile(path,'utf8')).toBe('old');expect(rename).toHaveBeenCalledTimes(1);expect(await readdir(dir)).toEqual(['market.json']);
});
