const { chromium } = require('playwright'); const dir=__dirname;
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:1080,height:1920}});
await p.goto('file://'+dir+'/profile-card.html');await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(700);
await p.locator('.slide').nth(0).screenshot({path:dir+'/out-premium/AVATAR-profile-4x5.png'});
await p.locator('.slide').nth(1).screenshot({path:dir+'/out-premium/AVATAR-profile-9x16.png'});await b.close();console.log('pc ok')})();
