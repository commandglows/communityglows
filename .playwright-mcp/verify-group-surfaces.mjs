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
  const storageKey='communityglows.sidebar-groups.v1:duplicate-fixture'
  await fixture.evaluate(key=>localStorage.setItem(key,JSON.stringify({customGroups:['personal:a','personal:b','personal:c','personal:d'],groupOrder:['personal:a','personal:b','personal:c','personal:d'],names:{'personal:a':'Travail','personal:b':'Clients','personal:c':'Projet','personal:d':'Archives'},parents:{'personal:b':'personal:a','personal:c':'personal:b'},membership:{twitter:'personal:c',facebook:'other','bento-scene:demo':'personal:c'}})),storageKey)
  await fixture.reload();await fixture.waitForFunction(()=>window.fixtureReady)
  const group=id=>fixture.locator(`[data-sidebar-group="personal:${id}"]`)
  const state=()=>fixture.evaluate(key=>JSON.parse(localStorage.getItem(key)),storageKey)
  const assert=(condition,message)=>{if(!condition)throw new Error(message)}
  async function drag(source,target,ratio=.5){const from=await source.boundingBox();const to=await target.boundingBox();await fixture.mouse.move(from.x+from.width/2,from.y+from.height/2);await fixture.mouse.down();await fixture.mouse.move(to.x+to.width/2,to.y+to.height*ratio,{steps:18});await fixture.mouse.up();await fixture.waitForTimeout(100)}
  const twitter=fixture.locator('[data-sidebar-network="twitter"]');const facebook=fixture.locator('[data-sidebar-network="facebook"]');
  const order=()=>fixture.locator('.network-menu-section [data-sidebar-group], .network-menu-section [data-sidebar-network]').evaluateAll(nodes=>nodes.map(n=>n.dataset.sidebarGroup||n.dataset.sidebarNetwork));
  async function begin(source,target,ratio=.8){const a=await source.boundingBox(),b=await target.boundingBox();await fixture.mouse.move(a.x+60,a.y+15);await fixture.mouse.down();await fixture.mouse.move(b.x+60,b.y+b.height*ratio,{steps:12});}
  const results=[];
  for(const dark of [false,true]){
    await fixture.evaluate(dark=>document.documentElement.classList.toggle('dark',dark),dark);
    const rows=await fixture.locator('[data-group-tone]').evaluateAll(nodes=>nodes.map(n=>({group:n.dataset.organizationGroup,fill:getComputedStyle(n).getPropertyValue('--sidebar-group-fill'),bg:getComputedStyle(n).backgroundColor,gradient:getComputedStyle(n).backgroundImage,text:n.textContent.trim(),width:n.getBoundingClientRect().width})));
    assert(rows.filter(n=>n.group==='personal:c').length>=3,'Nested members missing');assert(new Set(rows.filter(n=>n.group==='personal:c').map(n=>n.fill)).size===1,'Group members differ from header');assert(new Set(rows.map(n=>n.fill)).size>=3,'Depth shades missing');
    const root=await fixture.locator('[data-sidebar-network="facebook"]').evaluate(n=>n.closest('section').hasAttribute('data-group-tone'));assert(!root,'Root tab has group background');
    await fixture.locator('.network-menu-section').screenshot({path:'.playwright-mcp/group-surfaces-'+(dark?'dark':'light')+'.png'});results.push({dark,rows});
  }
  await group('b').locator('.network-group-header__main').click();assert(!await twitter.isVisible(),'Nested collapse failed');await group('b').locator('.network-group-header__main').click();assert(await twitter.isVisible(),'Nested expand failed');
  assert(errors.length===0,JSON.stringify(errors));console.log(JSON.stringify({results,errors}));
}finally{await browser.close()}
