// Keep teaching notes available without crowding the game selection.
document.querySelectorAll('.subject').forEach(subject=>{
  const heading=subject.querySelector('.subject-header');
  const name=heading.querySelector('.subject-title').textContent;
  const dialog=document.createElement('dialog');dialog.className='subject-dialog';
  dialog.setAttribute('aria-label','Over '+name);
  const title=document.createElement('h2');title.textContent=name;
  const close=document.createElement('button');close.type='button';close.className='shop-button';close.textContent='Sluiten';
  close.addEventListener('click',()=>dialog.close());
  dialog.append(title);
  subject.querySelectorAll('.subject-badge,.learning-path').forEach(note=>dialog.append(note));
  subject.querySelectorAll('.didactic-level').forEach(note=>{
    const game=document.createElement('h3');game.textContent=note.closest('.card').querySelector('.card-name').innerText.replace(/\n/g,' ');
    dialog.append(game,note);
  });
  const info=document.createElement('button');info.type='button';info.className='subject-info';info.textContent='i';info.setAttribute('aria-label','Informatie over '+name);info.setAttribute('aria-haspopup','dialog');
  info.addEventListener('click',()=>dialog.showModal());
  dialog.append(close);heading.append(info);document.body.append(dialog);
});
