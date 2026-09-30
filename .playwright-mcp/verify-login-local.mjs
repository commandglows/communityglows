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
  import {createApp,h,ref} from '${dep(source,'vue')}';import {createPinia} from '${dep(profileSource,'pinia')}';import {createRouter,createMemoryHistory} from '${dep(source,'vue-router')}';
  import Card from '/components/NativeWorkspaceCard.vue';import Sidebar from '/components/AppRightSidebar.vue';import {useProfilesStore} from '${root}/src/stores/profiles.ts';import {useWebviewStore} from '${root}/src/stores/webviewState.ts';import {builtInSocialNetworks} from '${root}/src/config/socialNetworks.ts';import {i18n} from '${root}/src/utils/i18n.ts';import {sgTooltip} from '/directives/tooltip.ts';import '${root}/src/assets/base.css';import '/assets/main.css';import '/assets/generated/tokens.css';
  import {useDesktopWorkspacesStore} from '${root}/src/stores/desktopWorkspaces.ts';
  const pinia=createPinia();useDesktopWorkspacesStore(pinia).initialized=true;useDesktopWorkspacesStore(pinia).workspaceState.layouts=[{id:'demo',name:'Veille',profileId:'duplicate-fixture',icon:'◻',color:'blue'}];const profiles=useProfilesStore(pinia);profiles.$patch({profiles:[{id:'duplicate-fixture',name:'Test',emoji:'🟦',createdAt:1,localOnly:true,hiddenNetworks:builtInSocialNetworks.filter(n=>!['twitter','facebook'].includes(n.id)).map(n=>n.id)}],activeProfileId:'duplicate-fixture'});window.fixtureProfiles=profiles;window.copyStore=useWebviewStore(pinia);
  import Login from '/views/LoginView.vue';import Tasks from '/views/TasksView.vue';import {authGuard} from '/router/guards.ts';
  const router=createRouter({history:createMemoryHistory(),routes:[{path:'/login',component:Login},{path:'/local-kanban',component:Tasks,props:{localOnly:true}},{path:'/tasks',component:Tasks,meta:{requiresAuth:true}}]});router.beforeEach(authGuard);await router.push('/login?access=loading');i18n.global.locale.value='fr';
  createApp({render:()=>h('div',{style:'height:100vh;display:flex'},[h(router.currentRoute.value.path==='/local-kanban'?Tasks:Login,router.currentRoute.value.path==='/local-kanban'?{localOnly:true}:{})])}).use(pinia).use(router).use(i18n).directive('sg-tooltip',sgTooltip).mount('#fixture');window.fixtureReady=true;  </script></body></html>`}))
  await fixture.goto(origin+'/__duplicate_sidebar.html');await fixture.waitForFunction(()=>window.fixtureReady)
  await fixture.evaluate(()=>localStorage.setItem('communityglows.sidebar-bento-display.v1','tabs'))
  await fixture.getByRole('button',{name:'Créer mon compte',exact:true}).waitFor();await fixture.screenshot({path:'.playwright-mcp/login-benefits.png'});
  await fixture.setViewportSize({width:420,height:650});const top=await fixture.locator('.login-card').boundingBox();if(top.y<0)throw new Error('Login card top clipped');
  await fixture.getByRole('button',{name:'Créer mon compte',exact:true}).click();await fixture.locator('input[type=email]').waitFor();
  await fixture.reload();await fixture.waitForFunction(()=>window.fixtureReady);
  await fixture.getByRole('link',{name:'Essayer le Kanban en local',exact:true}).click();
  await fixture.getByText('Kanban local · Sans synchronisation',{exact:true}).waitFor();
  await fixture.getByRole('button',{name:'Nouvelle tâche',exact:true}).click();await fixture.getByLabel('Titre',{exact:true}).fill('Ma première tâche locale');await fixture.getByRole('button',{name:'Créer la tâche',exact:true}).click();
  await fixture.getByText('Ma première tâche locale',{exact:true}).waitFor();
  await fixture.reload();await fixture.waitForFunction(()=>window.fixtureReady);await fixture.getByRole('link',{name:'Essayer le Kanban en local',exact:true}).click();await fixture.getByText('Ma première tâche locale',{exact:true}).waitFor();
  await fixture.setViewportSize({width:700,height:900});if(await fixture.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw new Error('Horizontal overflow');
  console.log('Account CTA and isolated local task creation/reload passed, compact view has no page overflow.');
  await fixture.screenshot({path:'.playwright-mcp/local-kanban.png'});
  if(errors.length)throw new Error(JSON.stringify(errors));
}finally{await browser.close()}
