import { mkdir, writeFile, rename, unlink } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
async function replace(temporary:string,path:string):Promise<void>{
  for(let attempt=0;;attempt++){
    try{await rename(temporary,path);return;}
    catch(error){
      const code=(error as NodeJS.ErrnoException).code;
      if(attempt>=5||!['EPERM','EBUSY','EACCES'].includes(code??''))throw error;
      await new Promise<void>(resolve=>setTimeout(resolve,20*2**attempt));
    }
  }
}
export async function writeAtomic(path: string, text: string): Promise<void> {
  await mkdir(dirname(path),{recursive:true});
  const temporary=`${path}.${process.pid}.${randomUUID()}.tmp`;
  try { await writeFile(temporary,text,{encoding:'utf8',mode:0o600}); await replace(temporary,path); }
  catch (error) { await unlink(temporary).catch(()=>{}); throw error; }
}
