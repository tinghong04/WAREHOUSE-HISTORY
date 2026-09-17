const U="https://brqurxainlsteygsqfcu.supabase.co";
const cors={"Access-Control-Allow-Origin":"https://cheerful-tanuki-93ee22.netlify.app","Access-Control-Allow-Methods":"POST, OPTIONS","Access-Control-Allow-Headers":"Content-Type"};
const reply=(body,status=200)=>Response.json(body,{status,headers:cors});
export default async req=>{
 if(req.method==="OPTIONS")return new Response("",{headers:cors});
 if(req.method!=="POST")return reply({error:"Method not allowed"},405);
 const key=Netlify.env.get("SUPABASE_SERVICE_ROLE_KEY");
 try{
  const {code,deviceId}=await req.json();
  const pair=String(code||"").trim();
  const id=String(deviceId||"").trim();
  if(!/^\d{6}$/.test(pair)||id.length<12)return reply({error:"绑定二维码无效"},400);
  const now=new Date().toISOString();
  const path="shipping_devices?pairing_code=eq."+encodeURIComponent(pair)+"&bound=eq.false&pairing_expires_at=gt."+encodeURIComponent(now);
  const r=await fetch(U+"/rest/v1/"+path,{method:"PATCH",headers:{apikey:key,Authorization:"Bearer "+key,"Content-Type":"application/json",Prefer:"return=representation"},body:JSON.stringify({device_id:id,label:"仓库手机",bound:true,pairing_code:null,pairing_expires_at:null})});
  if(!r.ok)throw Error(await r.text());
  const rows=await r.json();
  if(!rows[0])return reply({error:"二维码已使用或已过期，请在电脑版重新生成"},409);
  return reply({ok:true});
 }catch(e){return reply({error:e.message||"绑定失败"},500)}
};
export const config={path:"/api/shipping-claim"};