import { NotebookStore } from "./notebook-store.mjs";

const pageSize = 200;

export class AccountNotebook extends NotebookStore {
  constructor(account) {
    super({ memoryOnly:true });
    this.account = account;
    this.version = -1;
    this.pending = Promise.resolve();
  }

  get persistent() { return this.account.signedIn(); }

  serial(action) {
    const work = this.pending.then(action);
    this.pending = work.catch(() => {});
    return work;
  }

  refresh() {
    if (!this.persistent) return Promise.resolve();
    return this.serial(() => this.loadLatest());
  }

  async loadLatest() {
    for (let attempt=0; attempt<3; attempt++) {
      const entries = new Map();
      let after = "", version;
      for (;;) {
        const page = await this.account.rpc("munkyeol_read", {
          p_after:after, p_size:pageSize, p_known:after ? -1 : this.version
        });
        if (page.unchanged) return;
        if (!Number.isSafeInteger(page.version) || !Array.isArray(page.rows))
          throw new Error("계정에서 보관함을 읽지 못했습니다.");
        if (version !== undefined && page.version !== version) break;
        version = page.version;
        for (const row of page.rows) {
          if (typeof row.key !== "string" || typeof row.cursor !== "string" || row.cursor <= after)
            throw new Error("보관함 읽기 순서를 확인하지 못했습니다.");
          entries.set(row.key, row.value);
          after = row.cursor;
        }
        if (page.rows.length < pageSize) {
          this.memory = entries;
          this.version = version;
          this.auto = entries.get("automatic") !== false;
          return;
        }
      }
    }
    throw new Error("다른 창에서 기록이 변경됐습니다. 보관함을 다시 열어 주세요.");
  }

  change(method, args) {
    if (!this.persistent) return NotebookStore.prototype[method].apply(this, args);
    return this.serial(async () => {
      for (let attempt=0; attempt<3; attempt++) {
        await this.loadLatest();
        const draft = new NotebookStore({ memoryOnly:true });
        draft.memory = new Map(this.memory);
        draft.auto = this.auto;
        const result = await draft[method](...args);
        const changes = [];
        for (const [key,value] of draft.memory)
          if (!this.memory.has(key) || this.memory.get(key)!==value) changes.push({key,value});
        for (const key of this.memory.keys())
          if (!draft.memory.has(key)) changes.push({key,remove:true});
        if (!changes.length) return result;
        const receipt = await this.account.rpc("munkyeol_write", {
          p_expected:this.version, p_request:crypto.randomUUID(), p_changes:changes
        });
        if (!receipt.applied) continue;
        if (receipt.version !== this.version+1) throw new Error("계정 저장 결과를 다시 확인해 주세요.");
        this.memory = draft.memory;
        this.auto = this.memory.get("automatic") !== false;
        this.version = receipt.version;
        return result;
      }
      throw new Error("다른 기기에서 같은 기록을 수정 중입니다. 최신 기록을 확인한 뒤 다시 저장하세요.");
    });
  }

  apply(...args) { return this.change("apply",args); }
  setAuto(...args) { return this.change("setAuto",args); }
  saveFinalDocument(...args) { return this.change("saveFinalDocument",args); }

  async setGlossary(entries, expected) {
    await this.apply([{id:"account-glossary",table:"preferences",update:current=>{
      if (JSON.stringify(current || [])!==JSON.stringify(expected))
        throw new Error("다른 창에서 용어집이 바뀌었습니다. 용어집을 다시 열어 주세요.");
      return entries;
    }}]);
  }
}
