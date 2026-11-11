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
