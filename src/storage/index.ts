import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
export interface Storage { put(bytes:Buffer):Promise<string>; get(key:string):Promise<Buffer>; remove(key:string):Promise<void>; }
class LocalStorage implements Storage {
  private root=path.resolve(/*turbopackIgnore: true*/ process.env.STORAGE_DIR || ".data/attachments");
  private location(key:string) {if(!/^[a-f0-9-]{36}$/.test(key))throw new Error("Invalid storage key");return path.join(this.root,key);}
  async put(bytes:Buffer) {await mkdir(this.root,{recursive:true});const key=randomUUID();await writeFile(this.location(key),bytes,{mode:0o600});return key;}
  async get(key:string) {return readFile(this.location(key));}
  async remove(key:string) {await unlink(this.location(key));}
}
export const storage:Storage=new LocalStorage();
