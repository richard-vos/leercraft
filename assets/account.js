(() => {
  const root = document.currentScript.dataset.root || '.';
  const style = document.createElement('link');
  style.rel = 'stylesheet'; style.href = `${root}/assets/account.css`; document.head.append(style);
  const host = document.querySelector('[data-leercraft-account]');
  host.innerHTML = `<section class="account-panel" aria-label="Je account">
    <p data-account-status role="status">Account laden…</p>
    <p data-account-progress></p>
    <button type="button" data-login>Inloggen met e-mail</button>
    <button type="button" data-logout hidden>Uitloggen</button>
    <dialog class="account-dialog"><form data-email-form>
      <h2>Inloggen bij LeerCraft</h2><p>Ontvang een code per e-mail. Je hebt geen wachtwoord nodig.</p>
      <label>E-mailadres<input name="email" type="email" autocomplete="email" maxlength="255" required></label>
      <button>Stuur inlogcode</button></form>
      <form data-code-form hidden><h2>Vul je inlogcode in</h2><p data-code-recipient></p>
      <label>Code van 8 cijfers<input name="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{8}" minlength="8" maxlength="8" required></label>
      <button>Inloggen</button><button type="button" data-change-email>Andere e-mail / nieuwe code</button></form>
      <p data-login-message role="status"></p><button type="button" data-close>Sluiten</button>
    </dialog></section>`;
  const $ = selector => host.querySelector(selector);
  let email = null, pendingEmail = '';
  async function request(path, body) {
    let response, data;
    try {
      response = await fetch(`${root}/api/${path}`, {
        method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin', cache: 'no-store',
        headers: {Accept:'application/json', 'Content-Type':'application/json', 'X-Requested-With':'fetch'},
        ...(body === undefined ? {} : {body:JSON.stringify(body)})
      });
      data = await response.json();
    } catch { throw new Error('Verbinding met LeerCraft mislukt. Probeer het opnieuw.'); }
    if (!response.ok || !data.ok) throw new Error(data.error || 'Dit lukte niet. Probeer het opnieuw.');
    return data;
  }
  async function refresh() {
    $('[data-account-progress]').textContent = '';
    const fill = document.getElementById('xp-fill'), xp = document.getElementById('xp-text');
    if(xp){xp.textContent='Log in om punten te bewaren';fill.style.width='0%';}
    try {
      const me = await request('auth/me.php'); email = me.loggedIn ? me.email : null;
      $('[data-account-status]').textContent = email ? `Ingelogd als ${email}` : 'Speel als gast of log in om je punten te bewaren.';
      $('[data-login]').hidden = !!email; $('[data-logout]').hidden = !email;
      if (email) {
        const summary = await request('scores/summary.php');
        const game = summary.games.find(g => g.gameSlug === 'provincie-klikspel');
        $('[data-account-progress]').textContent = `${summary.totalPoints} punten · Provincieklikspel: ${game ? `${game.plays} keer afgerond · beste resultaat ${game.bestScore}/12` : 'nog niet afgerond'}`;
        if(xp){const points=summary.totalPoints;xp.textContent=`Level ${Math.floor(points/100)+1} · ${points} XP · ${100-points%100} tot volgend level`;fill.style.width=`${points%100}%`;}
      }
    } catch(error) { $('[data-account-status]').textContent = error.message; }
  }
  const dialog = $('dialog');
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
      $('[name=code]').value='';$('[name=code]').focus();$('[data-login-message]').textContent='Code aangevraagd. Maximaal 3 aanvragen per 15 minuten.';
    });
  };
  $('[data-code-form]').onsubmit = event => {
    event.preventDefault();submit(event.target,async()=>{
      await request('auth/verify-otp.php',{email:pendingEmail,code:$('[name=code]').value.trim()});
      $('[data-login-message]').textContent='';dialog.close();await refresh();
    });
  };
  $('[data-logout]').onclick = async () => {
    $('[data-logout]').disabled=true;
    try{await request('auth/logout.php',{});await refresh();}catch(error){$('[data-account-status]').textContent=error.message;}
    finally{$('[data-logout]').disabled=false;}
  };
  window.LeerCraft={request,refresh,openLogin:()=>dialog.showModal(),get email(){return email;}};
  window.LeerCraft.ready = refresh();
})();
