// An iOS-style alert for yes/no questions, used instead of the browser's confirm box.

export function confirmDialog({ title, message = '', confirm = 'Remove', destructive = true }) {
  const dialog = document.getElementById('confirm-dialog');
  const ok = document.getElementById('confirm-ok');
  const cancel = document.getElementById('confirm-cancel');
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-message').textContent = message;
  ok.textContent = confirm;
  ok.classList.toggle('destructive', destructive);

  return new Promise((resolve) => {
    const finish = (answer) => {
      ok.removeEventListener('click', yes);
      cancel.removeEventListener('click', no);
      dialog.removeEventListener('cancel', no);
      if (dialog.open) dialog.close();
      resolve(answer);
    };
    const yes = () => finish(true);
    const no = (event) => { event?.preventDefault(); finish(false); };
    ok.addEventListener('click', yes);
    cancel.addEventListener('click', no);
    dialog.addEventListener('cancel', no);
    dialog.showModal();
    cancel.focus();
  });
}

/**
 * An iOS-style action sheet: a short list of choices plus Cancel.
 * actions: [{ label, value, destructive? }]. Resolves with the chosen value, or null.
 */
export function actionSheet({ title = '', message = '', actions }) {
  let dialog = document.getElementById('action-sheet');
  if (!dialog) {
    dialog = document.createElement('dialog');
    dialog.id = 'action-sheet';
    dialog.className = 'ios-actions';
    dialog.innerHTML = '<div class="ios-actions-group"><div class="ios-actions-head"><h2></h2><p></p></div><div class="ios-actions-list"></div></div><button type="button" class="ios-actions-cancel">Cancel</button>';
    document.body.append(dialog);
  }
  const head = dialog.querySelector('.ios-actions-head');
  dialog.querySelector('h2').textContent = title;
  dialog.querySelector('p').textContent = message;
  head.hidden = !title && !message;
  const list = dialog.querySelector('.ios-actions-list');
  list.replaceChildren(...actions.map((action) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = action.label;
    button.dataset.value = action.value;
    if (action.destructive) button.classList.add('destructive');
    return button;
  }));

  return new Promise((resolve) => {
    const finish = (value) => {
      list.removeEventListener('click', pick);
      cancel.removeEventListener('click', none);
      dialog.removeEventListener('cancel', none);
      dialog.removeEventListener('click', outside);
      if (dialog.open) dialog.close();
      resolve(value);
    };
    const pick = (event) => {
      const button = event.target.closest('button');
      if (button) finish(button.dataset.value);
    };
    const none = (event) => { event?.preventDefault(); finish(null); };
    const outside = (event) => { if (event.target === dialog) none(); };
    const cancel = dialog.querySelector('.ios-actions-cancel');
    list.addEventListener('click', pick);
    cancel.addEventListener('click', none);
    dialog.addEventListener('cancel', none);
    dialog.addEventListener('click', outside);
    dialog.showModal();
    list.querySelector('button')?.focus();
  });
}
