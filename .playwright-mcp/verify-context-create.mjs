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
  await fixture.evaluate(key=>localStorage.setItem(key,JSON.stringify({customGroups:['personal:a','personal:b','personal:c','personal:d'],groupOrder:['personal:a','personal:b','personal:c','personal:d'],names:{'personal:a':'Travail','personal:b':'Clients','personal:c':'Projet','personal:d':'Archives'},membership:{twitter:'personal:b',facebook:'other','bento-scene:demo':'personal:c'}})),storageKey)
  await fixture.reload();await fixture.waitForFunction(()=>window.fixtureReady)
  const group=id=>fixture.locator(`[data-sidebar-group="personal:${id}"]`)
  const state=()=>fixture.evaluate(key=>JSON.parse(localStorage.getItem(key)),storageKey)
  const assert=(condition,message)=>{if(!condition)throw new Error(message)}
  async function drag(source,target,ratio=.5){const from=await source.boundingBox();const to=await target.boundingBox();await fixture.mouse.move(from.x+from.width/2,from.y+from.height/2);await fixture.mouse.down();await fixture.mouse.move(to.x+to.width/2,to.y+to.height*ratio,{steps:18});await fixture.mouse.up();await fixture.waitForTimeout(100)}
  {const from=await group('b').boundingBox();const to=await group('a').boundingBox();await fixture.mouse.move(from.x+60,from.y+15);await fixture.mouse.down();await fixture.mouse.move(to.x+60,to.y+15,{steps:12});await fixture.keyboard.press('Escape');await fixture.mouse.up();assert(!(await state()).parents?.['personal:b'],'Escape committed a move')}
  await drag(group('b'),group('a'))
  assert((await state()).parents['personal:b']==='personal:a','group did not nest')
  await drag(group('c'),group('b'))
  assert((await state()).parents['personal:c']==='personal:b','third level failed')
  assert(await fixture.locator('[data-organization-group="personal:c"] [data-sidebar-network="bento-scene:demo"]').isVisible(),'nested Bento absent')
  await group('c').click({button:'right'});
  assert(await fixture.getByRole('menuitem',{name:'Créer un groupe',exact:true}).getAttribute('aria-disabled')==='true','fourth level creation allowed');
  await fixture.keyboard.press('Escape');
  await drag(group('a'),group('d'))
  assert(!(await state()).parents['personal:a'],'subtree exceeded limit')
  await drag(group('a'),group('c'))
  assert(!(await state()).parents['personal:a'],'cycle accepted')
  assert(await fixture.locator('[data-sidebar-group="other"]').count()===0,'ungrouped header still shown')
  await group('a').getByRole('button').first().click()
  assert(!await group('b').isVisible()&&!await group('c').isVisible(),'fold did not hide descendants')
  assert(await fixture.locator('[data-sidebar-network="facebook"]').isVisible(),'root tab hidden')
  await group('a').getByRole('button').first().click()
  await fixture.reload();await fixture.waitForFunction(()=>window.fixtureReady)
  assert((await state()).parents['personal:c']==='personal:b','reload lost hierarchy')
  await fixture.screenshot({path:'.playwright-mcp/nested-sidebar.png'})
  await group('c').click({button:'right'});await fixture.getByRole('menuitem',{name:'Sortir du groupe',exact:true}).click()
  assert((await state()).parents['personal:c']==='personal:a','ungroup should move up one level')
  await drag(group('c'),group('b'))
  await group('b').click({button:'right'});await fixture.getByRole('menuitem',{name:/Supprimer le groupe|Dissoudre le groupe/}).click()
  assert((await state()).parents['personal:c']==='personal:a'&&(await state()).membership.twitter==='personal:a','dissolve lost children')
  await group('c').click({button:'right'});await fixture.getByRole('menuitem',{name:'Créer un groupe',exact:true}).click();
  await fixture.locator('[contenteditable="plaintext-only"]').first().fill('Sous-projet');await fixture.locator('[contenteditable="plaintext-only"]').first().press('Enter');
  let saved=await state();let created=Object.keys(saved.names).find(id=>saved.names[id]==='Sous-projet');assert(saved.parents[created]==='personal:c','group created at root');
  await fixture.locator('[data-sidebar-network="twitter"]').click({button:'right'});await fixture.getByRole('menuitem',{name:'Créer un groupe',exact:true}).click();
  await fixture.locator('[contenteditable="plaintext-only"]').first().fill('Depuis un onglet');await fixture.locator('[contenteditable="plaintext-only"]').first().press('Enter');
  saved=await state();created=Object.keys(saved.names).find(id=>saved.names[id]==='Depuis un onglet');assert(saved.parents[created]==='personal:a','item context ignored parent');
  await fixture.setViewportSize({width:700,height:900})
  assert(await fixture.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'horizontal overflow')
  assert(await fixture.evaluate(()=>window.nativeDragCount===0),'native drag session was started')
  assert(errors.length===0,JSON.stringify(errors))
  console.log(JSON.stringify({nested:true,depthLimit:true,cycleRejected:true,fold:true,rootTabs:true,persisted:true,ungroup:true,dissolve:true,responsive:true,noNativeDrag:true,escapeCancels:true,errors}))
} finally {await browser.close()}

