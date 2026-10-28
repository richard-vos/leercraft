(() => {
  const root = (document.currentScript.dataset.root || '.').replace(/\/$/, '');
  const style = document.createElement('link');
  style.rel = 'stylesheet'; style.href = `${root}/assets/account.css`; document.head.append(style);
  const host = document.querySelector('[data-leercraft-account]');
  const background = host.dataset?.background === 'true';
  host.innerHTML = `<section class="account-panel" aria-label="Je account">
    <p data-account-status role="status" hidden></p>
    <p data-account-progress></p>
    <button type="button" data-login>Inloggen</button>
    <button type="button" data-logout hidden>Uitloggen</button>
    <dialog class="account-dialog" aria-label="Inloggen bij LeerCraft"><form data-email-form>
      <h2>Inloggen bij LeerCraft</h2><p>Ontvang een code per e-mail. Je hebt geen wachtwoord nodig.</p>
      <label>E-mailadres<input name="email" type="email" autocomplete="email" maxlength="255" required></label>
      <button>Stuur inlogcode</button></form>
      <form data-code-form hidden><h2>Vul je inlogcode in</h2><p data-code-recipient></p>
      <fieldset class="otp-fieldset"><legend>Je code van 4 cijfers</legend>
        <div class="otp-grid">
          ${[1,2,3,4].map(n=>`<input data-otp-digit aria-label="Cijfer ${n} van 4" type="text" inputmode="numeric" autocomplete="${n===1?'one-time-code':'off'}" pattern="[0-9]" maxlength="4" required>`).join('')}
        </div>
      </fieldset>
      <button>Inloggen</button><button type="button" data-change-email>Andere e-mail / nieuwe code</button></form>
      <p data-login-message role="status"></p><button type="button" data-close aria-label="Inlogscherm sluiten">&times;</button>
    </dialog></section>`;
  const $ = selector => host.querySelector(selector) || dialog.querySelector(selector);
  let email = null, pendingEmail = '';
  const accountListeners = new Set();
  function updateProgress(points) {
    const fill=document.getElementById('xp-fill'),xp=document.getElementById('xp-text');
    if(!xp||!fill)return;
    const level=Math.floor(points/100)+1,remaining=100-points%100;
    const number=document.getElementById('header-level-number'),next=document.getElementById('xp-next'),track=document.getElementById('header-xp-track');
    xp.textContent=number?`${points.toLocaleString('nl-NL')} XP`:`Level ${level} · ${points} XP · ${remaining} tot volgend level`;
    fill.style.width=`${points%100}%`;
    if(number)number.textContent=level;
    if(next)next.textContent=`${remaining} XP tot level ${level+1}`;
    if(track){track.setAttribute('aria-valuenow',String(points%100));track.setAttribute('aria-valuetext',`${remaining} XP tot level ${level+1}`);}
  }
  function renderHistory(summary) {
    const total=document.getElementById('history-total'),games=document.getElementById('history-games');
    if(!total||!games)return;
    games.replaceChildren();
    total.textContent=summary?`${summary.totalPoints} punten verdiend${summary.wallet?' · '+summary.wallet.spent+' munten uitgegeven':''}`:'Log in om je voortgang te bekijken.';
    if(!summary)return;
    if(!summary.games.length){games.textContent='Je hebt nog geen spellen afgerond.';return;}
    const names={'provincie-klikspel':'Provincieklikspel','provincie-schrijfspel':'Provincies schrijven',rekencraft:'RekenCraft',getallenzee:'Getallenzee','reken-race':'Reken Race'};
    for(const game of summary.games){
      const row=document.createElement('article'),title=document.createElement('h3'),detail=document.createElement('p');
      title.textContent=names[game.gameSlug]||game.gameSlug;
      detail.textContent=`${game.plays} keer gespeeld · ${game.totalScore*10} punten verdiend`;
      if(['provincie-klikspel','provincie-schrijfspel'].includes(game.gameSlug))detail.textContent+=` · beste score ${game.bestScore}/12`;
      row.append(title,detail);games.append(row);
    }
  }
  async function request(path, body) {
    let response, data;
    const controller=typeof AbortController==='function'?new AbortController():null;
    const timer=controller?setTimeout(()=>controller.abort(),8000):null;
    try {
      response = await fetch(`${root}/api/${path}`, {
        method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin', cache: 'no-store',
        headers: {Accept:'application/json', 'Content-Type':'application/json', 'X-Requested-With':'fetch'},
        ...(body === undefined ? {} : {body:JSON.stringify(body)}),
        ...(controller?{signal:controller.signal}:{})
      });
      data = await response.json();
    } catch { throw new Error('Verbinding met LeerCraft mislukt. Probeer het opnieuw.'); }
    finally{if(timer!==null)clearTimeout(timer);}
    if (!response.ok || !data.ok) throw new Error(data.error || 'Dit lukte niet. Probeer het opnieuw.');
    return data;
  }
  async function refresh() {
    renderHistory(null);
    $('[data-account-progress]').textContent = '';
    if(!email)updateProgress(0);
    try {
      const me = await request('auth/me.php');
      const previousEmail = email;
      email = me.loggedIn ? me.email : null;
      if(!email||email!==previousEmail)updateProgress(0);
      if(!email||email!==previousEmail)window.LeerCraftAvatar?.clear();
      if (email !== previousEmail) accountListeners.forEach(listener => listener(email));
      $('[data-account-status]').textContent = '';
      $('[data-account-status]').hidden = true;
      $('[data-login]').hidden = !!email; $('[data-logout]').hidden = !email;
      if (email) {
        const summary = await request('scores/summary.php');
        renderHistory(summary);
        const province = summary.games.find(g => g.gameSlug === 'provincie-klikspel');
        const runner = summary.games.find(g => g.gameSlug === 'rekencraft');
        const sea = summary.games.find(g => g.gameSlug === 'getallenzee');
        const details = [];
        if(province)details.push(`Provincieklikspel: ${province.plays} keer · beste ${province.bestScore}/12`);
        if(runner)details.push(`RekenCraft: ${runner.plays} levels gehaald · ${runner.totalScore*10} punten`);
        if(sea)details.push(`Getallenzee: ${sea.plays} races gewonnen · ${sea.totalScore*10} punten`);
        $('[data-account-progress]').textContent = `${summary.totalPoints} punten${details.length?' · '+details.join(' · '):' · nog geen spellen afgerond'}`;
        if(summary.wallet)$('[data-account-progress]').textContent += summary.wallet.unlimited?' · onbeperkte testmunten':` · ${summary.wallet.balance} te besteden`;
        updateProgress(summary.totalPoints);
      }
    } catch(error) { $('[data-account-status]').textContent = error.message; $('[data-account-status]').hidden = false; }
    await window.LeerCraftAvatar?.refresh();
  }
  const dialog = $('dialog');
  const digits = [...host.querySelectorAll('[data-otp-digit]')];
  function fillDigits(text, start) {
    const numbers = text.replace(/[^0-9]/g, '').slice(0, 4);
    if (!numbers) return;
    if (numbers.length === 4) start = 0;
    for (let n = 0; n < numbers.length && start + n < 4; n++) digits[start+n].value = numbers[n];
    digits[Math.min(start + numbers.length, 3)].focus();
    digits[Math.min(start + numbers.length, 3)].select();
  }
  digits.forEach((input, index) => {
    input.addEventListener('focus', () => input.select());
    input.addEventListener('input', () => {
      const value = input.value;
      input.value = '';
      fillDigits(value, index);
    });
    input.addEventListener('paste', event => {
      event.preventDefault();
      fillDigits(event.clipboardData.getData('text'), index);
    });
    input.addEventListener('keydown', event => {
      if (event.key === 'Backspace' && !input.value && index > 0) {
        event.preventDefault();digits[index-1].value='';digits[index-1].focus();
      } else if (event.key === 'ArrowLeft' && index > 0) {
        event.preventDefault();digits[index-1].focus();
      } else if (event.key === 'ArrowRight' && index < 3) {
        event.preventDefault();digits[index+1].focus();
      }
    });
  });
  $('[data-login]').onclick = () => dialog.showModal();
  $('[data-close]').onclick = () => dialog.close();
  $('[data-change-email]').onclick = () => { $('[data-email-form]').hidden=false; $('[data-code-form]').hidden=true; $('[data-login-message]').textContent=''; $('[name=email]').focus(); };
  async function submit(form, action) {
    const buttons = [...dialog.querySelectorAll('button')];buttons.forEach(b=>b.disabled=true);
    $('[data-login-message]').textContent='Even geduld…';
    try{await action();}catch(error){$('[data-login-message]').textContent=error.message;}
    finally{buttons.forEach(b=>b.disabled=false);}
  }
  $('[data-email-form]').onsubmit = event => {
    event.preventDefault();submit(event.target, async()=>{
      pendingEmail=$('[name=email]').value.trim().toLowerCase();
      await request('auth/request-otp.php',{email:pendingEmail});
      $('[data-email-form]').hidden=true;$('[data-code-form]').hidden=false;
      $('[data-code-recipient]').textContent=`Bekijk de inbox en spammap van ${pendingEmail}. De code is 10 minuten geldig.`;
      digits.forEach(input=>input.value='');digits[0].focus();$('[data-login-message]').textContent='Code aangevraagd. Maximaal 3 aanvragen per 15 minuten.';
    });
  };
  $('[data-code-form]').onsubmit = event => {
    event.preventDefault();submit(event.target,async()=>{
      await request('auth/verify-otp.php',{email:pendingEmail,code:digits.map(input=>input.value).join('')});
      $('[data-login-message]').textContent='';dialog.close();await refresh();
    });
  };
  $('[data-logout]').onclick = async () => {
    $('[data-logout]').disabled=true;
    try{await request('auth/logout.php',{});await refresh();}catch(error){$('[data-account-status]').textContent=error.message;}
    finally{$('[data-logout]').disabled=false;}
  };
  window.LeerCraft={request,refresh,openLogin:()=>{if(background){window.location.href='/';return;}dialog.showModal();},
    onChange(listener){accountListeners.add(listener);return ()=>accountListeners.delete(listener);},
    get email(){return email;}};
  window.LeerCraft.ready = refresh();
  if (!background && host.dataset?.dialogOutside === 'true') {
    // Full-screen games hide their menu while playing. Keep login outside that hidden ancestor.
    const portal=document.createElement('div');
    portal.className='account-panel account-dialog-portal';
    portal.append(dialog);document.body.append(portal);
  }
})();
