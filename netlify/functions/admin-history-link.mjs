const U="https://brqurxainlsteygsqfcu.supabase.co",ADMIN="gohtinghong2004@gmail.com";
const enc=new TextEncoder();
const b64=b=>btoa(String.fromCharCode(...new Uint8Array(b))).replaceAll("+","-").replaceAll("/","_").replace(/=+$/,"");
async function signature(id,key){const k=await crypto.subtle.importKey("raw",enc.encode(key),{name:"HMAC",hash:"SHA-256"},false,["sign"]);return b64(await crypto.subtle.sign("HMAC",k,enc.encode("history-batch:"+id)))}
export default async req=>{
 if(req.method!=="POST")return new Response("Method not allowed",{status:405});
 const key=Netlify.env.get("SUPABASE_SERVICE_ROLE_KEY"),token=req.headers.get("authorization");if(!key||!token)return new Response("未登录",{status:401});
 try{
  const auth=await fetch(U+"/auth/v1/user",{headers:{apikey:key,Authorization:token}}),user=await auth.json();
  if(!auth.ok||user.email!==ADMIN)return new Response("仅管理员可生成链接",{status:403});
  const {taskId}=await req.json(),id=String(taskId||"").trim();if(!id)return new Response("记录无效",{status:400});
  const task=await fetch(U+"/rest/v1/tasks?select=batch_no&id=eq."+encodeURIComponent(id)+"&limit=1",{headers:{apikey:key,Authorization:"Bearer "+key}});
  const row=task.ok?(await task.json())[0]:null,batch=String(row?.batch_no||"").trim();if(!batch)return new Response("该记录没有批次号，无法生成客户链接",{status:400});
  return Response.json({batchNo:batch,token:await signature(batch,key)});
 }catch{return new Response("生成链接失败",{status:500})}
};
export const config={path:"/api/admin-history-link"};