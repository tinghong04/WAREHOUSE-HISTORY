const U="https://brqurxainlsteygsqfcu.supabase.co";
async function db(p,k,o={}){const r=await fetch(U+"/rest/v1/"+p,{...o,headers:{apikey:k,Authorization:"Bearer "+k,"Content-Type":"application/json",...(o.headers||{})}});if(!r.ok)throw Error(await r.text()||"数据库保存失败");return r}
function imageBytes(data){const m=String(data||"").match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/i);if(!m)throw Error("面单照片格式无效");const bytes=Uint8Array.from(atob(m[2]),c=>c.charCodeAt(0));if(!bytes.length||bytes.length>4*1024*1024)throw Error("面单照片请控制在 4MB 以内");return{bytes,ext:m[1].toLowerCase()==="jpeg"?"jpg":m[1]}}
async function uploadLabel(taskId,orderNo,data,k){const {bytes,ext}=imageBytes(data),safe=encodeURIComponent(String(orderNo)).replace(/%/g,"_"),path="customer-labels/"+taskId+"/"+safe+"_"+Date.now()+"."+ext;const r=await fetch(U+"/storage/v1/object/task-order-photos/"+path,{method:"POST",headers:{apikey:k,Authorization:"Bearer "+k,"Content-Type":"image/"+(ext==="jpg"?"jpeg":ext),"x-upsert":"false"},body:bytes});if(!r.ok)throw Error("面单照片上传失败");await db("task_order_photos",k,{method:"POST",headers:{Prefer:"return=minimal"},body:JSON.stringify({task_id:taskId,order_no:"TK面单："+String(orderNo),storage_path:path,captured_at:new Date().toISOString()})})}
export default async req=>{
 if(req.method!=="POST")return new Response(JSON.stringify({error:"Method not allowed"}),{status:405,headers:{"Content-Type":"application/json"}});
 const k=Netlify.env.get("SUPABASE_SERVICE_ROLE_KEY");if(!k)return Response.json({error:"暂不可用"},{status:503});
 try{
  const {customer,taskId,orderNo,status,trackingNo,photoData}=await req.json(),name=String(customer||"").trim();
  if(!name||!taskId||!orderNo||!["tk","return"].includes(status)||!String(trackingNo||"").trim())return Response.json({error:"资料不完整"},{status:400});
  if(status==="tk"&&!photoData)return Response.json({error:"请附上 TK 面单照片"},{status:400});
  const rows=await (await db("tasks?select=customer_name,task_content&id=eq."+encodeURIComponent(taskId)+"&limit=1",k)).json();
  if(!rows[0]||rows[0].customer_name!==name)return Response.json({error:"订单不属于该客户"},{status:403});
  let m={};try{m=JSON.parse(rows[0].task_content||"{}")}catch{m={type:rows[0].task_content||"order"}}m.type=m.type||"order";m.customer_actions=m.customer_actions||{};if(m.customer_actions[String(orderNo)])return Response.json({error:"该单号已填写，客户不能再次修改"},{status:409});
  if(status==="tk")await uploadLabel(taskId,orderNo,photoData,k);
  m.customer_actions[String(orderNo)]={status,tracking_no:String(trackingNo).trim(),updated_at:new Date().toISOString()};
  await db("tasks?id=eq."+encodeURIComponent(taskId),k,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({task_content:JSON.stringify(m)})});
  return Response.json({ok:true})
 }catch(e){return Response.json({error:e.message||"保存失败"},{status:500})}
};
export const config={path:"/api/customer-action"};