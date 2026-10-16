import {test,expect} from './fixtures.js';
test('two_or_three_columns_have_equal_chart_widths_and_no_missing_changes',async({page,context,testApp})=>{
  await testApp.barList();await page.goto('/admin');await page.getByLabel('Passwort').fill(testApp.password);await page.getByRole('button',{name:'Anmelden',exact:true}).click();
  await page.getByRole('tab',{name:'Gästeansicht',exact:true}).click();await expect(page.getByRole('combobox',{name:'Chartdarstellung',exact:true})).toHaveValue('bars-gap');
  await page.getByRole('tab',{name:'Gästeansicht',exact:true}).click();const tempo=page.getByTestId('ticker-speed');await expect(tempo).toHaveAttribute('max','4');await expect(page.getByTestId('ticker-speed-value')).toContainText('3 s');await expect(tempo).toBeEnabled();await tempo.focus();await tempo.press('Home');await expect(page.getByTestId('ticker-speed-value')).toContainText('4 s');expect((await(await page.request.get('/api/admin/state')).json()).state.parameters.tickerRowMs).toBe(4000);
  await page.getByRole('tab',{name:'Gästeansicht',exact:true}).click();const choice=page.getByRole('combobox',{name:'Laufliste: Spalten',exact:true});await expect(choice).toHaveValue('3');await page.getByRole('tab',{name:'Gästeansicht',exact:true}).click();await page.getByRole('button',{name:'Laufliste',exact:true}).click();
  const display=await context.newPage();await display.setViewportSize({width:1920,height:1080});await display.goto('/display');await expect(display.locator('.ticker-column')).toHaveCount(3);for(const [index,name]of ['Wein · Longdrinks · Bier','Shots','Alkoholfrei'].entries())await expect(display.locator('.ticker-column').nth(index)).toHaveAttribute('data-group',name);
  await page.getByRole('tab',{name:'Einstellungen',exact:true}).click();await expect(page.getByTestId('simulation-speed')).toHaveValue('1');await page.getByRole('tab',{name:'Einstellungen',exact:true}).click();await page.getByTestId('simulation-enabled').check();await expect(page.getByTestId('simulation-speed')).toHaveValue('1');
  for(const columns of [2,3]){
    await page.getByRole('tab',{name:'Gästeansicht',exact:true}).click();await choice.selectOption(String(columns));await expect(display.locator('.ticker-column')).toHaveCount(columns);
    for(const id of ['limo','rum']){const delta=display.locator(`[data-quote-drink="${id}"] .ticker-change`).first();await expect(delta).toContainText('0,00');await expect(delta).toContainText('0,0 %');}
    await testApp.externalCommand({type:'correct',drinkId:'bier',value:500});
    const widths=await display.locator('#ticker svg').evaluateAll(nodes=>nodes.map(svg=>({outer:svg.getBoundingClientRect().width,plot:Number(svg.getAttribute('data-plot-width'))})));
    expect(Math.max(...widths.map(w=>w.outer))-Math.min(...widths.map(w=>w.outer))).toBeLessThan(1);
    expect(Math.max(...widths.map(w=>w.plot))-Math.min(...widths.map(w=>w.plot))).toBeLessThan(1);
    await testApp.advanceTo(columns*12000);await display.screenshot({path:`.artifacts/previews/ticker-equal-charts-${columns}.png`});
  }
  await page.reload();await page.getByRole('tab',{name:'Gästeansicht',exact:true}).click();await expect(page.getByRole('combobox',{name:'Laufliste: Spalten',exact:true})).toHaveValue('3');
  for(const width of [1000,1280]){
    await display.setViewportSize({width,height:720});await expect(display.locator('.ticker-column')).toHaveCount(3);
    const delta=display.locator('[data-quote-drink="bier"] .ticker-change').first();expect(await delta.evaluate(element=>element.getBoundingClientRect().height/parseFloat(getComputedStyle(element).lineHeight))).toBeLessThanOrEqual(2.05);
    const dimensions=await display.locator('#ticker svg').evaluateAll(nodes=>nodes.map(svg=>Number(svg.getAttribute('data-plot-width'))));expect(Math.max(...dimensions)-Math.min(...dimensions)).toBeLessThanOrEqual(1);
    expect(await display.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }
  const config=(await(await page.request.get('/api/admin/state')).json()).state.config.slice(0,4);
  await testApp.externalCommand({type:'reset',kind:'evening'});await testApp.externalCommand({type:'configure',drinks:config});await expect(display.locator('.ticker-column')).toHaveCount(1);await expect(display.locator('.ticker-row')).toHaveCount(12);
  expect(await display.locator('.ticker-column').evaluateAll(columns=>columns.every(column=>column.querySelectorAll('.ticker-row').length>0))).toBe(true);
  expect(await display.locator('.ticker-row').evaluateAll(rows=>[...new Set(rows.map(row=>row.getAttribute('data-quote-drink')))].sort())).toEqual(config.map((d:{id:string})=>d.id).sort());
  await display.setViewportSize({width:390,height:844});await expect(display.locator('.ticker-column')).toHaveCount(1);expect(await display.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
