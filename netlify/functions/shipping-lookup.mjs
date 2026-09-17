const U="https://brqurxainlsteygsqfcu.supabase.co";
const cors={"Access-Control-Allow-Origin":"https://cheerful-tanuki-93ee22.netlify.app","Access-Control-Allow-Methods":"POST, OPTIONS","Access-Control-Allow-Headers":"Content-Type"};
const reply=(body,status=200)=>Response.json(body,{status,headers:cors});
function meta(t){try{const x=JSON.parse(t.task_content||"{}");return typeof x==="object"?x:{type:t.task_content||"order"}}catch{return{type:t.task_content||"order"}}}
async function q(path,key){const r=await fetch(U+"/rest/v1/"+path,{headers:{apikey:key,Authorization:"Bearer "+key}});if(!r.ok)throw Error();return r.json()}
export default async req=>{
 if(req.method==="OPTIONS")return new Response("",{headers:cors});
 if(req.method!=="POST")return reply({error:"Method not allowed"},405);
 const key=Netlify.env.get("SUPABASE_SERVICE_ROLE_KEY");
 try{
  const {deviceId,customer,orderNo}=await req.json(),id=String(deviceId||""),name=String(customer||"").trim(),order=String(orderNo||"").trim();
  const devices=await q("shipping_devices?select=device_id,bound&device_id=eq."+encodeURIComponent(id)+"&limit=1",key);
  if(!devices[0]||devices[0].bound!==true)return reply({error:"这台手机尚未绑定，请先扫描电脑版生成的绑定二维码"},403);
  if(!name||!order)return reply({error:"请选择客户并扫描虾皮单号"},400);
  const items=await q("task_items?select=task_id,sku&sku=eq."+encodeURIComponent(order)+"&limit=50",key);
  for(const item of items){const rows=await q("tasks?select=id,customer_name,task_content&id=eq."+encodeURIComponent(item.task_id)+"&limit=1",key),task=rows[0],m=task&&meta(task),a=m?.customer_actions?.[order];if(task&&task.customer_name===name&&m.type==="order"&&a?.status==="tk"&&a.tracking_no)return reply({ok:true,trackingNo:a.tracking_no})}
  return reply({error:"没有找到已填写 TK 的虾皮单号"},404)
 }catch{return reply({error:"查询失败"},500)}
};
export const config={path:"/api/shipping-lookup"};