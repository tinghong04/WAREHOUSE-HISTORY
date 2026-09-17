const U="https://brqurxainlsteygsqfcu.supabase.co",ADMIN="gohtinghong2004@gmail.com";
const enc=new TextEncoder();
const b64=b=>btoa(String.fromCharCode(...new Uint8Array(b))).replaceAll("+","-").replaceAll("/","_").replace(/=+$/,"");
async function signature(id,key){const k=await crypto.subtle.importKey("raw",enc.encode(key),{name:"HMAC",hash:"SHA-256"},false,["sign"]);return b64(await crypto.subtle.sign("HMAC",k,enc.encode("history:"+id)))}
export default async req=>{
 if(req.method!=="POST")return new Response("Method not allowed",{status:405});
 const key=Netlify.env.get("SUPABASE_SERVICE_ROLE_KEY"),token=req.headers.get("authorization");if(!key||!token)return new Response("未登录",{status:401});
 try{
  const auth=await fetch(U+"/auth/v1/user",{headers:{apikey:key,Authorization:token}}),user=await auth.json();
  if(!auth.ok||user.email!==ADMIN)return new Response("仅管理员可生成链接",{status:403});
  const {taskId}=await req.json(),id=String(taskId||"").trim();if(!id)return new Response("记录无效",{status:400});
  const task=await fetch(U+"/rest/v1/tasks?select=id&id=eq."+encodeURIComponent(id)+"&limit=1",{headers:{apikey:key,Authorization:"Bearer "+key}});
  if(!task.ok||!(await task.json())[0])return new Response("记录不存在",{status:404});
  return Response.json({token:await signature(id,key)});
 }catch{return new Response("生成链接失败",{status:500})}
};
export const config={path:"/api/admin-history-link"};