import { MunkyeolAccount } from "./account-auth.mjs";
import { AccountNotebook } from "./account-store.mjs";

export function mountAccount(settings) {
  let storage;
  try { storage=window.sessionStorage; } catch { storage=null; }
  const account=new MunkyeolAccount(settings,{storage});
  const store=new AccountNotebook(account);
  account.onClear=()=>{store.memory.clear();store.version=-1;store.auto=true;};
  const el=id=>document.getElementById(id);
  const dialog=el("account-dialog"), action=el("account-button"), status=el("account-status");
  const address=el("account-email"),proof=el("account-proof");
  const form=el("account-form"),send=el("account-send"),verify=el("account-verify");
  const signed=account.signedIn();
  action.hidden=false;action.textContent=signed ? "내 계정" : "로그인";
  el("owner-storage-note").textContent=signed ? "개인 기록은 로그인한 계정에 저장됩니다." : "로그인하면 다른 기기에서도 내 기록을 열 수 있습니다.";
  el("account-heading").textContent=signed ? "내 계정" : "문결 로그인";
  el("account-info").hidden=!signed;form.hidden=signed;
  el("account-address").textContent=account.session?.email || "";
  const leave=()=>{document.body.hidden=true;location.replace(location.pathname);};
  let loginChannel;
  try {loginChannel=new BroadcastChannel("munkyeol.account.signout."+settings.url);}
  catch { /* A tab still clears its own active session. */ }
  loginChannel?.addEventListener("message",event=>{
    if (event.data===account.session?.userId && signed) {account.clear();leave();}
  });
  addEventListener("pageshow",event=>{if (event.persisted) leave();});
  action.onclick=()=>{dialog.showModal();if (!signed) address.focus();};
  el("account-close").onclick=()=>dialog.close();
  dialog.addEventListener("close",()=>{proof.value="";});
  send.onclick=async()=>{
    if (!address.reportValidity()) return;
    send.disabled=true;status.textContent="인증 메일을 요청하고 있습니다.";
    try {
      await account.sendEmail(address.value.trim());
      el("account-proof-row").hidden=false;
      status.textContent="메일을 확인하세요. 메일 속 로그인 버튼의 링크 주소를 복사해 아래 칸에 붙여 넣으세요.";
      proof.focus();
    } catch(error){status.textContent=error.message;}
    finally {send.disabled=false;}
  };
  el("account-have-proof").onclick=()=>{el("account-proof-row").hidden=false;proof.focus();};
  form.onsubmit=async event=>{
    event.preventDefault();
    if (el("account-proof-row").hidden) {send.click();return;}
    if (!address.reportValidity() || !proof.value.trim()) {proof.focus();return;}
    verify.disabled=true;status.textContent="계정 권한을 확인하고 있습니다.";
    try {
      if (!storage) throw new Error("로그인을 유지하려면 이 탭의 세션 저장을 허용하세요.");
      await account.verify(address.value.trim(),proof.value);
      if (!storage.getItem(account.sessionKey)) throw new Error("이 탭의 세션을 저장할 수 없습니다.");
      proof.value="";leave();
    } catch(error){account.clear();proof.value="";status.textContent=error.message;verify.disabled=false;}
  };
  el("account-signout").onclick=async()=>{
    const uid=account.session?.userId;
    form.hidden=true;el("account-info").hidden=true;
    action.disabled=true;el("account-close").disabled=true;status.textContent="로그아웃 중입니다.";
    const logout=account.signOut();
    if(uid) loginChannel?.postMessage(uid);
    for(const field of document.querySelectorAll('textarea,input:not([type]),input[type="text"],input[type="email"],input[type="password"],input[type="search"]')) field.value="";
    const clearing=document.createElement("p");clearing.textContent="로그아웃 중입니다.";clearing.setAttribute("role","status");
    document.body.replaceChildren(clearing);
    await logout;
    leave();
  };
  return store;
}
