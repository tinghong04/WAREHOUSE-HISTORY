const U="https://brqurxainlsteygsqfcu.supabase.co";
async function db(p,k,o={}){const r=await fetch(U+"/rest/v1/"+p,{...o,headers:{apikey:k,Authorization:"Bearer "+k,"Content-Type":"application/json",...(o.headers||{})}});if(!r.ok)throw Error(await r.text()||"数据库保存失败");return r}
export default async req=>{
 if(req.method!=="POST")return new Response(JSON.stringify({error:"Method not allowed"}),{status:405,headers:{"Content-Type":"application/json"}});
 const k=Netlify.env.get("SUPABASE_SERVICE_ROLE_KEY");if(!k)return Response.json({error:"暂不可用"},{status:503});
 try{
  const {customer,taskId,orderNo,status,trackingNo}=await req.json(),name=String(customer||"").trim();
  if(!name||!taskId||!orderNo||!["tk","return"].includes(status)||!String(trackingNo||"").trim())return Response.json({error:"资料不完整"},{status:400});
  const rows=await (await db("tasks?select=customer_name,task_content&id=eq."+encodeURIComponent(taskId)+"&limit=1",k)).json();
  if(!rows[0]||rows[0].customer_name!==name)return Response.json({error:"订单不属于该客户"},{status:403});
  let m={};try{m=JSON.parse(rows[0].task_content||"{}")}catch{m={type:rows[0].task_content||"order"}}m.type=m.type||"order";m.customer_actions=m.customer_actions||{};m.customer_actions[String(orderNo)]={status,tracking_no:String(trackingNo).trim(),updated_at:new Date().toISOString()};
  await db("tasks?id=eq."+encodeURIComponent(taskId),k,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({task_content:JSON.stringify(m)})});
  return Response.json({ok:true})
 }catch(e){return Response.json({error:e.message||"保存失败"},{status:500})}
};
export const config={path:"/api/customer-action"};