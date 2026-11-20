const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1280,height:720}});
await p.goto('file://'+__dirname+'/miniC.html');await p.waitForTimeout(1200);await p.screenshot({path:__dirname+'/miniC.jpg',type:'jpeg',quality:93});await b.close();})();
