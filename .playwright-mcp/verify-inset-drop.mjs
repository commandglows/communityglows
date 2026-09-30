import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
const browser = await chromium.launch({headless:true, executablePath:'C:/Users/Diane/AppData/Local/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-win64/chrome-headless-shell.exe'})
try {
  const page = await browser.newPage()
  const origin='http://127.0.0.1:3006'
  const root='/@fs/C:/Users/Diane/ShipGlows/communityglows'
  const source=await(await page.request.get(origin+'/components/AppSidebar.vue')).text()
  const profileSource=await(await page.request.get(origin+root+'/src/stores/profiles.ts')).text()
  const dep=(text,name)=>text.match(new RegExp('"([^"\n]*/'+name+'\\.js\\?[^"\n]+)"'))[1]
  const context=await browser.newContext({viewport:{width:1440,height:1000}})
  await context.addInitScript(()=>{window.nativeDragCount=0;document.addEventListener('dragstart',event=>{if(event.isTrusted)window.nativeDragCount++},true)})
  const fixture=await context.newPage()
  const errors=[];fixture.on('pageerror',error=>errors.push(error.message))
  await fixture.route('**/__duplicate_sidebar.html',route=>route.fulfill({contentType:'text/html; charset=utf-8',body:`<html><head><meta charset="utf-8"></head><body><div id="fixture"></div><script type="module">
  import {createApp,h} from '${dep(source,'vue')}';import {createPinia} from '${dep(profileSource,'pinia')}';import {createRouter,createMemoryHistory} from '${dep(source,'vue-router')}';
  import Sidebar from '/components/AppSidebar.vue';import {useProfilesStore} from '${root}/src/stores/profiles.ts';import {useWebviewStore} from '${root}/src/stores/webviewState.ts';import {builtInSocialNetworks} from '${root}/src/config/socialNetworks.ts';import {i18n} from '${root}/src/utils/i18n.ts';import {sgTooltip} from '/directives/tooltip.ts';import '${root}/src/assets/base.css';import '/assets/main.css';import '/assets/generated/tokens.css';
  import {useDesktopWorkspacesStore} from '${root}/src/stores/desktopWorkspaces.ts';
  const pinia=createPinia();useDesktopWorkspacesStore(pinia).initialized=true;useDesktopWorkspacesStore(pinia).workspaceState.layouts=[{id:'demo',name:'Veille',profileId:'duplicate-fixture',icon:'◻',color:'blue'}];const profiles=useProfilesStore(pinia);profiles.$patch({profiles:[{id:'duplicate-fixture',name:'Test',emoji:'🟦',createdAt:1,localOnly:true,hiddenNetworks:builtInSocialNetworks.filter(n=>!['twitter','facebook'].includes(n.id)).map(n=>n.id)}],activeProfileId:'duplicate-fixture'});window.fixtureProfiles=profiles;window.copyStore=useWebviewStore(pinia);
  const router=createRouter({history:createMemoryHistory(),routes:[{path:'/:pathMatch(.*)*',component:{render:()=>null}}]});await router.push('/');i18n.global.locale.value='fr';createApp({render:()=>h('div',{style:'height:100vh;display:flex'},[h(Sidebar,{modelValue:true,controlBarPosition:'bottom',bentoActive:false},{default:()=>h('main','Synthetic duplicate fixture; no account data')})])}).use(pinia).use(router).use(i18n).directive('sg-tooltip',sgTooltip).mount('#fixture');window.fixtureReady=true;
  </script></body></html>`}))
  await fixture.goto(origin+'/__duplicate_sidebar.html');await fixture.waitForFunction(()=>window.fixtureReady)
  await fixture.evaluate(()=>localStorage.setItem('communityglows.sidebar-bento-display.v1','tabs'))
  await fixture.locator('[data-sidebar-network="twitter"]').waitFor();
  const sourceBox=await fixture.locator('[data-sidebar-network="twitter"]').boundingBox();const group=fixture.locator('[data-sidebar-group="social"]');const dest=await group.boundingBox();
  await fixture.mouse.move(sourceBox.x+80,sourceBox.y+15);await fixture.mouse.down();await fixture.mouse.move(dest.x+80,dest.y+15,{steps:12});
  await fixture.waitForFunction(()=>document.querySelector('[data-sidebar-group="social"]').getAttribute('data-drop-position')==='inside');
  const ring=await group.evaluate(el=>({offset:parseFloat(getComputedStyle(el).outlineOffset),width:parseFloat(getComputedStyle(el).outlineWidth)}));
  if(ring.offset+ring.width>0)throw new Error('Drop ring extends beyond row');
  await fixture.screenshot({path:'.playwright-mcp/inset-drop-ring.png'});
  await fixture.keyboard.press('Escape');await fixture.mouse.up();
  if(errors.length)throw new Error(JSON.stringify(errors));console.log(JSON.stringify({ring,errors}));
}finally{await browser.close()}
