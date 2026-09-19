const U="https://brqurxainlsteygsqfcu.supabase.co";
const cors={"Access-Control-Allow-Origin":"https://cheerful-tanuki-93ee22.netlify.app","Access-Control-Allow-Methods":"POST, OPTIONS","Access-Control-Allow-Headers":"Content-Type"};
const reply=(body,status=200)=>Response.json(body,{status,headers:cors});
function meta(t){try{const x=JSON.parse(t.task_content||"{}");return typeof x==="object"?x:{}}catch{return{}}}
async function rest(path,key,init={}){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),6500);
 try{const r=await fetch(U+"/rest/v1/"+path,{...init,signal:controller.signal,headers:{apikey:key,Authorization:"Bearer "+key,"Content-Type":"application/json",...(init.headers||{})}});if(!r.ok)throw Error("保存失败");return r}finally{clearTimeout(timer)}
}
export default async req=>{
 if(req.method==="OPTIONS")return new Response("",{headers:cors});
 if(req.method!=="POST")return reply({error:"Method not allowed"},405);
 const key=Netlify.env.get("SUPABASE_SERVICE_ROLE_KEY");
 try{
  const {deviceId,taskId,orderNo,trackingNo}=await req.json();
  const id=String(deviceId||""),task=String(taskId||""),order=String(orderNo||""),tracking=String(trackingNo||"").trim();
  const devices=await (await rest("shipping_devices?select=device_id,bound&device_id=eq."+encodeURIComponent(id)+"&limit=1",key)).json();
  if(!devices[0]||devices[0].bound!==true)return reply({error:"这台手机尚未绑定"},403);
  if(!task||!order||!tracking)return reply({error:"核对资料不完整"},400);
  const rows=await (await rest("tasks?select=task_content&id=eq."+encodeURIComponent(task)+"&limit=1",key)).json();
  if(!rows[0])return reply({error:"找不到换单记录"},404);
  const m=meta(rows[0]),action=m.customer_actions&&m.customer_actions[order];
  if(!action||action.status!=="tk"||String(action.tracking_no||"").trim()!==tracking)return reply({error:"TK 单号与换单记录不一致"},409);
  m.customer_actions[order]={...action,shipping_status:"shipped",shipped_at:new Date().toISOString()};
  await rest("tasks?id=eq."+encodeURIComponent(task),key,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({task_content:JSON.stringify(m)})});
  return reply({ok:true,shippedAt:m.customer_actions[order].shipped_at});
 }catch(e){return reply({error:e.name==="AbortError"?"保存超时，请重试":(e.message||"保存失败")},500)}
};
export const config={path:"/api/shipping-confirm"};