const U="https://brqurxainlsteygsqfcu.supabase.co";
const cors={"Access-Control-Allow-Origin":"https://cheerful-tanuki-93ee22.netlify.app","Access-Control-Allow-Methods":"GET, OPTIONS"};
export default async req=>{
 if(req.method==="OPTIONS")return new Response("",{headers:cors});
 const key=Netlify.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!key)return new Response("暂不可用",{status:503,headers:cors});
 try{
  const r=await fetch(U+"/rest/v1/customer_access?select=customer_name&order=customer_name.asc",{headers:{apikey:key,Authorization:"Bearer "+key}});
  if(!r.ok)throw Error();
  const data=await r.json();
  return Response.json((data||[]).map(x=>x.customer_name).filter(Boolean),{headers:{"Cache-Control":"no-store",...cors}});
 }catch{return Response.json([],{status:500,headers:cors})}
};