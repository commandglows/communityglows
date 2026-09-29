import { chromium } from 'playwright'
async function run(page) {
  const origin = 'http://127.0.0.1:3006';
  const source = await (await page.request.get(origin + '/components/DesktopWorkspace.vue')).text();
  const dep = name => source.match(new RegExp('"([^"\\n]*/' + name + '\\.js\\?[^"\\n]+)"'))[1];
  const context = await page.context().browser().newContext({ viewport: { width: 1280, height: 900 } });
  const fixture = await context.newPage();
  const errors = [];
  fixture.on('pageerror', e => errors.push(e.message));
  const html = `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="/assets/generated/tokens.css"><style>body{margin:0;color:var(--sg-color-text);background:var(--sg-color-surface-raised);font-family:sans-serif}#app{height:900px}.fixture{display:flex;height:100%}.sidebar{width:290px;flex-shrink:0}.dock{flex:1;min-width:0}</style></head><body><div id="app"></div><script type="module">
  import '/@fs/C:/Users/Diane/ShipGlows/communityglows/node_modules/dockview-vue/dist/styles/dockview.css';
  import { createApp, h, ref, markRaw } from '${dep('vue')}';
  import { createI18n } from '${dep('vue-i18n')}';
  import { DockviewVue, themeLight } from '${dep('dockview-vue')}';
  import Sidebar from '/components/BentoSidebarTabs.vue';import '/assets/main.css';
  import { snapshotBentoSidebar, applyBentoSidebarCommand } from '/components/bentoSidebarBridge.ts';
  const messages={sidebarTabs:{title:'Onglets ouverts',empty:'Aucun onglet ouvert',name:'Nom du groupe',save:'Enregistrer',cancel:'Annuler',ungrouped:'Sans groupe',actions:'Actions pour {name}',up:'Monter',down:'Descendre',rename:'Renommer',dissolve:'Dissoudre le groupe',create:'Nouveau groupe',ungroup:'Sortir du groupe',moveTo:'Déplacer vers {name}'}};
  const snapshot=ref(null);let api; const refresh=()=>snapshot.value=snapshotBentoSidebar(api,'fixture','scene');
  const command=c=>{ const result=applyBentoSidebarCommand(api,'fixture',c);refresh();return result };
  const app=createApp({setup(){const components={fixture:markRaw({render:()=>h('p','Synthetic content')}),network:markRaw({render:()=>h('p','Synthetic network')})};return()=>h('div',{class:'fixture'},[h('div',{class:'sidebar'},snapshot.value?h(Sidebar,{snapshot:snapshot.value,onCommand:command}):null),h(DockviewVue,{class:'dock',components,theme:themeLight,onReady:event=>{api=event.api; for(const id of ['a','b','c'])api.addPanel({id,component:'fixture',title:'Tab '+id,...(api.activePanel?{position:{referencePanel:api.activePanel,direction:'within'}}:{})});const pane=api.activePanel.group.id; const g=api.createTabGroup({groupId:pane,label:'Research'});api.addPanelToTabGroup({groupId:pane,tabGroupId:g.id,panelId:'a'});api.addPanelToTabGroup({groupId:pane,tabGroupId:g.id,panelId:'b'});refresh();api.onDidLayoutChange(refresh);window.bentoFixture={api,command,refresh,snapshot};}})])}});app.use(createI18n({legacy:false,locale:'fr',messages:{fr:messages}}));app.mount('#app');
  </script></body></html>`;
  await context.route('**/__bento_fixture.html', route => route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:html}));
  await fixture.goto(origin + '/__bento_fixture.html');
  await fixture.waitForFunction(()=>window.bentoFixture?.api.panels.length===3);
  const group=fixture.locator('[data-sidebar-motion-key^="group:"]');
  await group.locator('.bento-sidebar-tabs__label').click();
  const tab=fixture.locator('[data-sidebar-motion-key="tab:c"]');
  const from=await tab.boundingBox(),to=await group.boundingBox();
  await fixture.mouse.move(from.x+50,from.y+15);await fixture.mouse.down();await fixture.mouse.move(to.x+50,to.y+15,{steps:12});await fixture.mouse.up();
  await fixture.waitForFunction(()=>document.querySelector('[data-sidebar-arrived]'));
  const result=await fixture.evaluate(()=>({arrival:document.querySelector('[data-sidebar-arrived]').dataset.sidebarMotionKey,animations:document.getAnimations().length,expanded:document.querySelector('[data-sidebar-motion-key^="group:"] button').getAttribute('aria-expanded')}));
  if(result.arrival!=='tab:c'||!result.animations||result.expanded!=='true')throw Error(JSON.stringify(result));
  await fixture.waitForTimeout(1100);
  if(await fixture.locator('[data-sidebar-arrived]').count())throw Error('Bento marker retained');
  await fixture.screenshot({path:'.playwright-mcp/bento-drop-motion.png'});
  console.log(JSON.stringify({result,errors}));if(errors.length)throw Error(JSON.stringify(errors));await context.close();
}
const browser=await chromium.launch({headless:true,executablePath:'C:/Users/Diane/AppData/Local/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-win64/chrome-headless-shell.exe'});
try {await run(await browser.newPage())} finally {await browser.close()}
