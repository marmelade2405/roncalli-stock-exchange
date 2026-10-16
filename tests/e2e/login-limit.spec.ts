import {test,expect} from './fixtures.js';
test('login_page_shows_the_one_hour_lock_after_ten_failures_and_keeps_it_after_reload',async({page,testApp})=>{
 await testApp.barList();await page.goto('/admin');const password=page.getByLabel('Passwort'),button=page.getByRole('button',{name:'Anmelden',exact:true}),error=page.locator('#login-error');
 for(let i=0;i<10;i++){await password.fill('wrong-password');await button.click();await expect(error).toContainText(i<9?'Das Passwort ist nicht korrekt.':'Bitte in 60 Minuten erneut versuchen.');}
 await page.reload();await password.fill(testApp.password);await button.click();await expect(error).toContainText('Zu viele falsche Anmeldeversuche');await expect(page.locator('#controls')).toBeHidden();
 const response=await page.request.post('/api/login',{headers:{Origin:testApp.baseURL},data:{password:testApp.password}});expect(response.status()).toBe(429);expect(Number(response.headers()['retry-after'])).toBeGreaterThan(3500);
 await page.screenshot({path:'.artifacts/previews/login-hour-lock.png'});
});
