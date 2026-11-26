const expiredMessage = "로그인이 만료되었습니다. 다시 로그인해 주세요.";

export function emailProof(input, origin, email) {
  const value = input.trim();
  if (/^\d{6,10}$/.test(value)) return {email, token:value, type:"email"};
  let link;
  try { link = new URL(value); } catch { /* Show the same guidance for invalid links and codes. */ }
  if (link?.origin!==origin || link?.pathname!=="/auth/v1/verify" || link.username || link.password)
    throw new Error("인증 메일의 로그인 버튼에서 복사한 링크나 숫자 인증 코드를 입력하세요.");
  const hash = link.searchParams.get("token") || link.searchParams.get("token_hash");
  const type = link.searchParams.get("type");
  if (!hash || !/^[A-Za-z0-9_.~-]{24,256}$/.test(hash) || !["email","signup","magiclink"].includes(type))
    throw new Error("로그인 링크의 형식을 확인하세요.");
  return {token_hash:hash,type};
}

export class MunkyeolAccount {
  constructor(config, {storage=sessionStorage, fetcher=fetch, onExpired=()=>location.reload()}={}) {
    this.origin = new URL(config.url).origin;
    this.key = config.key;
    this.fetcher = fetcher;
    this.storage = storage;
    this.onExpired = onExpired;
    this.sessionKey = "munkyeol.account.session.v1."+this.origin;
    this.session = null;
    try { this.session=JSON.parse(storage.getItem(this.sessionKey)); } catch { /* A disabled store still allows a session in this tab. */ }
    if (this.session && (!this.session.access || !this.session.refresh || !this.session.userId)) this.clear();
  }

  signedIn() { return Boolean(this.session); }

  clear() {
    this.session=null;
    try { this.storage.removeItem(this.sessionKey); } catch { /* RAM was already cleared. */ }
    this.onClear?.();
  }

  accept(result) {
    if (typeof result.access_token!=="string" || typeof result.refresh_token!=="string" || !result.user?.id)
      throw new Error("로그인 결과를 확인하지 못했습니다. 인증을 다시 시도해 주세요.");
    this.session={access:result.access_token, refresh:result.refresh_token, userId:result.user.id,
      email:result.user.email || "", expires:Date.now()+Number(result.expires_in || 3600)*1000};
    try { this.storage.setItem(this.sessionKey,JSON.stringify(this.session)); } catch { /* Keep the session in memory until this tab closes. */ }
  }

  async post(path, body, token) {
    const headers={"Content-Type":"application/json",apikey:this.key};
    if (token) headers.Authorization="Bearer "+token;
    let response;
    try { response=await this.fetcher(this.origin+path,{method:"POST",headers,body:JSON.stringify(body),
      credentials:"omit",cache:"no-store",referrerPolicy:"no-referrer",signal:AbortSignal.timeout(20000)}); }
    catch { throw new Error("계정 서버에 연결하지 못했습니다. 연결 상태를 확인하고 다시 시도하세요."); }
    if (response.ok) {
      const raw=await response.text();
      return raw ? JSON.parse(raw) : null;
    }
    const error=new Error(response.status===429 ? "요청이 많습니다. 잠시 뒤 다시 시도하세요." :
      response.status===401 ? expiredMessage : response.status===403 ? "이 계정에는 문결 보관함 접근 권한이 없습니다." :
      "계정 요청을 처리하지 못했습니다. 인증 정보와 연결 상태를 확인하세요.");
    error.status=response.status;
    throw error;
  }

  sendEmail(email) {
    return this.post("/auth/v1/otp",{email,create_user:true});
  }

  async verify(email,input) {
    const result=await this.post("/auth/v1/verify",emailProof(input,this.origin,email));
    if (result.user?.email?.toLowerCase()!==email.toLowerCase())
      throw new Error("입력한 이메일 주소와 인증한 계정이 다릅니다.");
    this.accept(result);
    try { await this.rpc("munkyeol_read",{p_after:"",p_size:1,p_known:-1}); }
    catch(error){await this.signOut();throw error;}
  }

  async renew() {
    if (this.refreshing) return this.refreshing;
    const original=this.session;
    if (!original) throw new Error(expiredMessage);
    this.refreshing=this.post("/auth/v1/token?grant_type=refresh_token",{refresh_token:original.refresh})
      .then(result=>{if (this.session===original) this.accept(result);})
      .catch(error=>{
        if (this.session===original && [400,401,403].includes(error.status)) {this.clear();this.onExpired();}
        throw error;
      }).finally(()=>{this.refreshing=null;});
    return this.refreshing;
  }

  async rpc(name,body) {
    if (!this.session) throw new Error("문결에 로그인하세요.");
    if (Date.now()>this.session.expires-60000) await this.renew();
    const path="/rest/v1/rpc/"+name;
    try { return await this.post(path,body,this.session.access); }
    catch(error) {
      if (!this.session) throw new Error(expiredMessage);
      if (error.status===401) await this.renew();
      else if (error.status || name!=="munkyeol_write") throw error;
      return this.post(path,body,this.session.access);
    }
  }

  async signOut() {
    const access=this.session?.access;
    this.clear();
    if (access) await this.post("/auth/v1/logout?scope=local",{},access).catch(()=>{});
  }
}
