const U="https://brqurxainlsteygsqfcu.supabase.co",ADMIN="gohtinghong2004@gmail.com";
async function api(path,key,opts={}){const r=await fetch(U+"/rest/v1/"+path,{...opts,headers:{apikey:key,Authorization:"Bearer "+key,"Content-Type":"application/json",...(opts.headers||{})}});if(!r.ok)throw Error(await r.text()||"数据库操作失败");return r}
async function isAdmin(token,key){const r=await fetch(U+"/auth/v1/user",{headers:{apikey:key,Authorization:token}}),u=await r.json();return r.ok&&u.email===ADMIN}
function meta(raw){try{const m=JSON.parse(raw||"{}");return m&&typeof m==="object"?m:{type:raw||"count"}}catch{return{type:raw||"count"}}}
export default async req=>{
 if(req.method!=="POST")return new Response("Method not allowed",{status:405});
 const key=Netlify.env.get("SUPABASE_SERVICE_ROLE_KEY"),token=req.headers.get("authorization");
 if(!key||!token)return new Response("未登录",{status:401});
 try{
  if(!await isAdmin(token,key))return new Response("仅管理员可修改",{status:403});
  const {taskId,items}=await req.json();
  if(!taskId||!Array.isArray(items)||!items.length||items.length>200)return new Response("修改资料无效",{status:400});
  const taskRows=await (await api("tasks?select=id,task_content&id=eq."+encodeURIComponent(taskId)+"&limit=1",key)).json(),task=taskRows[0];
  if(!task)return new Response("任务不存在",{status:404});
  const current=await (await api("task_items?select=sku,qty&task_id=eq."+encodeURIComponent(taskId),key)).json(),existing=new Map(current.map(x=>[String(x.sku),x]));
  const changed=new Set(),m=meta(task.task_content);m.box_details=m.box_details||{};
  for(const input of items){
   const original=String(input.originalSku||"").trim(),sku=String(input.sku||"").trim(),qty=Math.max(0,parseInt(input.qty,10)||0);
   if(!original||!sku||!existing.has(original)||changed.has(sku))throw Error("SKU 资料重复或无效");
   if(sku!==original&&existing.has(sku)&&!items.some(x=>String(x.originalSku||"").trim()===sku))throw Error("SKU 名称已存在："+sku);
   changed.add(sku);
   await api("task_items?task_id=eq."+encodeURIComponent(taskId)+"&sku=eq."+encodeURIComponent(original),key,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({sku,qty})});
   if(m.box_mode){
     const boxes=Math.max(0,parseInt(input.boxes,10)||0),perBox=Math.max(0,parseInt(input.perBox,10)||0);
     delete m.box_details[original];m.box_details[sku]={boxes,per_box:perBox};
   }
  }
  const all=await (await api("task_items?select=sku,qty&task_id=eq."+encodeURIComponent(taskId),key)).json(),total=all.reduce((sum,x)=>sum+(Number(x.qty)||0),0);
  await api("tasks?id=eq."+encodeURIComponent(taskId),key,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({total_qty:total,sku_types:all.length,task_content:JSON.stringify(m)})});
  return Response.json({ok:true,total,skuTypes:all.length})
 }catch(e){return new Response(e.message||"修改失败",{status:400})}
};
export const config={path:"/api/admin-update-task-items"};