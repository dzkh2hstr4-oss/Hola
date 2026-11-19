const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1280,height:720}});
await p.goto('file://'+__dirname+'/miniatura.html');await p.waitForTimeout(1500);
await p.screenshot({path:__dirname+'/miniatura.jpg',type:'jpeg',quality:92});await b.close();})();
