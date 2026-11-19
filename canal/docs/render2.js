const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1280,height:720}});
await p.goto('file://'+__dirname+'/miniB2.html');await p.waitForTimeout(1200);await p.screenshot({path:__dirname+'/miniB2.jpg',type:'jpeg',quality:93});await b.close();})();
