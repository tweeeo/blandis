const el = document.getElementById('toast');
let timer = 0;

export function toast(title, sub) {
  el.innerHTML = `${title}<small>${sub}</small>`;
  el.classList.add('show');
  clearTimeout(timer);
  timer = setTimeout(() => el.classList.remove('show'), 2600);
}
