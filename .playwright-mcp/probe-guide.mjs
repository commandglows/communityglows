import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,executablePath:'C:/Users/Diane/AppData/Local/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-win64/chrome-headless-shell.exe'});
try {const page=await browser.newPage({viewport:{width:1400,height:950}});await page.goto('http://127.0.0.1:3006/#/login');await page.waitForTimeout(1800);console.log((await page.locator('body').innerText()).slice(0,1800));}finally{await browser.close()}
