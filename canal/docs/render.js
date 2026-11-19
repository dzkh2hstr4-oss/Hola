const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1280,height:720}});
for(const n of ['miniA','miniB']){await p.goto('file://'+__dirname+'/'+n+'.html');await p.waitForTimeout(1200);await p.screenshot({path:__dirname+'/'+n+'.jpg',type:'jpeg',quality:92});}
await b.close();})();
