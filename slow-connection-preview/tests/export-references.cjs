const path=require('node:path');const fs=require('node:fs');const {pathToFileURL}=require('node:url');
const launch=require('./browser.cjs');
const root=path.resolve(__dirname,'..');const url=pathToFileURL(path.join(root,'index.html')).href;
const manifest=JSON.parse(fs.readFileSync(path.join(root,'spec/state-manifest.json'),'utf8'));
(async()=>{
 const browser=await launch();const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
 for(const item of manifest){
  await page.goto(url+'?reference='+item.state);await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(400);
  await page.screenshot({path:path.join(root,item.image),type:'jpeg',quality:95,animations:'disabled'});
  console.log(item.image);
 }
 await page.goto(url+'?reference=baseline');await page.locator('[data-device="mobile"]').click();await page.waitForTimeout(1200);
 await page.screenshot({path:path.join(root,'references/08_mobile_device_preview.jpg'),type:'jpeg',quality:95,animations:'disabled'});
 await page.setViewportSize({width:390,height:844});await page.goto(url+'?reference=diagnose');await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(400);
 await page.screenshot({path:path.join(root,'references/09_phone_viewport.jpg'),type:'jpeg',quality:95,fullPage:true,animations:'disabled'});
 await page.setViewportSize({width:1366,height:768});await page.goto(url+'?reference=pending');await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(400);
 await page.screenshot({path:path.join(root,'references/10_compact_desktop.jpg'),type:'jpeg',quality:95,animations:'disabled'});
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
