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
  const guide=ref(null);const labels={feed:'Fil d’actualité',profile:'Profil',notifications:'Notifications',saved:'Enregistrements',events:'Événements'};
  const router=createRouter({history:createMemoryHistory(),routes:[{path:'/:pathMatch(.*)*',component:{render:()=>null}}]});await router.push('/');i18n.global.locale.value='fr';
  createApp({render:()=>h('div',{style:'height:100vh;display:flex'},[h(Sidebar,{modelValue:true,controlBarPosition:'bottom',onOpenRightpanelSection:section=>guide.value={section,centralized:false},onOpenRightpanelGeneral:section=>guide.value={section,centralized:true}},{default:()=>h('main',{style:'height:100%;display:grid;place-items:center;padding:16px;box-sizing:border-box'},guide.value?h(Card,{navigationGuide:true,sectionTitle:labels[guide.value.section],centralized:guide.value.centralized}):'Espace central')})])}).use(pinia).use(router).use(i18n).directive('sg-tooltip',sgTooltip).mount('#fixture');window.fixtureReady=true;  </script></body></html>`}))
  await fixture.goto(origin+'/__duplicate_sidebar.html');await fixture.waitForFunction(()=>window.fixtureReady)
  await fixture.evaluate(()=>localStorage.setItem('communityglows.sidebar-bento-display.v1','tabs'))
  await fixture.locator('.sidebar-content').click({button:'right',position:{x:80,y:880}});
  const menu=fixture.locator('[data-right-general-menu]');await menu.waitFor();
  if(!await menu.getByRole('menuitem',{name:'Paramètres',exact:true}).isVisible())throw new Error('Settings missing');
  await menu.getByRole('menuitem',{name:'Thème',exact:false}).hover();
  await fixture.getByRole('menuitemradio',{name:'Sombre',exact:true}).waitFor();
  await fixture.screenshot({path:'.playwright-mcp/right-general-menu.png'});
  await fixture.keyboard.press('Escape');await fixture.keyboard.press('Escape');
  const card=fixture.locator('.native-workspace-card');
  await fixture.getByRole('button',{name:'Notifications',exact:true}).click();await card.getByText('Clic gauche · Sur le réseau sélectionné',{exact:true}).waitFor();
  if(!await card.getByText('Sélectionnez un réseau',{exact:false}).isVisible())throw new Error('missing guidance');
  await fixture.getByRole('button',{name:'Enregistrements',exact:true}).click({button:'right'});
  if(await fixture.locator('[data-right-general-menu]').count())throw new Error('General menu intercepts shortcut');
  await card.getByRole('heading',{name:'Enregistrements',exact:true}).waitFor();
  if(!await card.getByText('Elle n’est pas encore disponible.',{exact:false}).isVisible())throw new Error('missing planned state');
  if(await card.getByRole('link').count())throw new Error('unrelated native download CTA shown');
  await fixture.screenshot({path:'.playwright-mcp/right-guide.png'});
  await fixture.setViewportSize({width:850,height:900});if(!await card.isVisible())throw new Error('card hidden');
  if(errors.length)throw new Error(JSON.stringify(errors));console.log(JSON.stringify({leftClick:true,rightClick:true,plannedState:true,reusedCard:true,errors}));
}finally{await browser.close()}

