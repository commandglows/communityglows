import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
const browser = await chromium.launch({headless:true, executablePath:'C:/Users/Diane/AppData/Local/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-win64/chrome-headless-shell.exe'})
try {
  const page = await browser.newPage()
  const bento = await eval(`(${readFileSync(new URL('./verify-duplicate-bento.cjs', import.meta.url),'utf8')})`)(page)
  console.log(JSON.stringify({bento}))
  const origin='http://127.0.0.1:3006'
  const root='/@fs/C:/Users/Diane/ShipGlows/communityglows'
  const source=await(await page.request.get(origin+'/components/AppSidebar.vue')).text()
  const profileSource=await(await page.request.get(origin+root+'/src/stores/profiles.ts')).text()
  const dep=(text,name)=>text.match(new RegExp('"([^"\n]*/'+name+'\\.js\\?[^"\n]+)"'))[1]
  const context=await browser.newContext({viewport:{width:1440,height:1000}})
  const fixture=await context.newPage()
  const errors=[];fixture.on('pageerror',error=>errors.push(error.message))
  await fixture.route('**/__duplicate_sidebar.html',route=>route.fulfill({contentType:'text/html; charset=utf-8',body:`<html><head><meta charset="utf-8"></head><body><div id="fixture"></div><script type="module">
  import {createApp,h} from '${dep(source,'vue')}';import {createPinia} from '${dep(profileSource,'pinia')}';import {createRouter,createMemoryHistory} from '${dep(source,'vue-router')}';
  import Sidebar from '/components/AppSidebar.vue';import {useProfilesStore} from '${root}/src/stores/profiles.ts';import {useWebviewStore} from '${root}/src/stores/webviewState.ts';import {builtInSocialNetworks} from '${root}/src/config/socialNetworks.ts';import {i18n} from '${root}/src/utils/i18n.ts';import {sgTooltip} from '/directives/tooltip.ts';import '${root}/src/assets/base.css';import '/assets/main.css';import '/assets/generated/tokens.css';
  const pinia=createPinia();const profiles=useProfilesStore(pinia);profiles.$patch({profiles:[{id:'duplicate-fixture',name:'Test',emoji:'🟦',createdAt:1,localOnly:true,hiddenNetworks:builtInSocialNetworks.filter(n=>!['twitter','facebook'].includes(n.id)).map(n=>n.id)}],activeProfileId:'duplicate-fixture'});window.fixtureProfiles=profiles;window.copyStore=useWebviewStore(pinia);
  const router=createRouter({history:createMemoryHistory(),routes:[{path:'/:pathMatch(.*)*',component:{render:()=>null}}]});await router.push('/');i18n.global.locale.value='fr';createApp({render:()=>h('div',{style:'height:100vh;display:flex'},[h(Sidebar,{modelValue:true,controlBarPosition:'bottom',bentoActive:false},{default:()=>h('main','Synthetic duplicate fixture; no account data')})])}).use(pinia).use(router).use(i18n).directive('sg-tooltip',sgTooltip).mount('#fixture');window.fixtureReady=true;
  </script></body></html>`}))
  await fixture.goto(origin+'/__duplicate_sidebar.html');await fixture.waitForFunction(()=>window.fixtureReady)
  await fixture.locator('[data-sidebar-network="twitter"]').click({button:'right'})
  await fixture.getByRole('menuitem',{name:'Dupliquer',exact:true}).click()
  const copy=fixture.locator('[data-sidebar-network^="copy:"]');await copy.waitFor()
  const result=await fixture.evaluate(()=>({network:window.copyStore.activeNetworkId,instance:window.copyStore.activeInstanceId,profile:window.fixtureProfiles.activeProfileId,order:[...document.querySelectorAll('[data-organization-group="social"] [data-sidebar-network]')].map(e=>e.dataset.sidebarNetwork)}))
  if(result.network!=='twitter'||!result.instance||result.profile!=='duplicate-fixture'||result.order[1]!==`copy:${result.instance}`)throw new Error('Invalid duplicate '+JSON.stringify(result))
  await fixture.reload();await fixture.waitForFunction(()=>window.fixtureReady);await copy.waitFor()
  await copy.click({button:'right'});await fixture.getByRole('menuitem',{name:'Fermer la copie',exact:true}).click()
  if(await copy.count()!==0||await fixture.locator('[data-sidebar-network="twitter"]').count()!==1)throw new Error('Copy closure lost source')
  await fixture.screenshot({path:'C:/Users/Diane/ShipGlows/communityglows/.playwright-mcp/duplicate-sidebar.png'})
  console.log(JSON.stringify({sidebar:{...result,persisted:true,independentClose:true},errors}))
} finally {await browser.close()}
