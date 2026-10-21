(() => {
  const { CATEGORIES, TECHNIQUES, PRODUCTS, PHOTOS, SETS, GLAZES, CLAYS, CONTACTS } = window.KYN;
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const byId = new Map(PRODUCTS.map((p) => [p.id, p]));
  const money = (n) => n.toLocaleString('ru-RU').replace(/ /g, ' ') + ' ₸';
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // Пары «плитка / силуэт» из палитры — как на референсе с цветами глазурей
  const TONES = [
    ['t-sand', 'c-espresso'], ['t-cobalt', 'c-ochre'], ['t-espresso', 'c-sand'], ['t-ochre', 'c-cream'],
    ['t-cream', 'c-terracotta'], ['t-rust', 'c-sand'], ['t-terracotta', 'c-clay'], ['t-slate', 'c-sand'],
    ['t-clay', 'c-slate'],
  ];
  const tone = (id) => TONES[id % TONES.length];
  const icon = (name, cls = '') => `<svg class="${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const title = (p) => p.name + (p.note ? ` <small>(${esc(p.note)})</small>` : '');
  const spec = (p) => [p.ml && `${p.ml} мл`, `Ø ${p.d} см`, p.h && `h ${String(p.h).replace('.', ',')} см`].filter(Boolean).join(' · ');

  function placeholder(p, extra = '') {
    const [bg, fg] = tone(p.id);
    const photo = PHOTOS[p.id];
    return `<div class="ph ${bg} ${fg} ${extra}">
      ${photo ? `<img src="assets/img/${esc(photo)}" alt="${esc(p.name)}" loading="lazy">` : icon(p.icon)}
      <span class="ph__num">№${p.id}</span>
      <span class="ph__tag">${p.tech === 'wheel' ? 'гончарный круг' : 'литьё'}</span>
    </div>`;
  }

  /* ---------- Каталог ---------- */
  const state = { cat: 'all', tech: 'all' };
  const grid = $('[data-grid]');

  function renderChips() {
    const count = (key, val) => PRODUCTS.filter((p) => val === 'all' || p[key] === val).length;
    const chip = (key, val, label) =>
      `<button class="chip" type="button" data-key="${key}" data-val="${val}" aria-pressed="${state[key] === val}">${label}<span class="n">${count(key, val)}</span></button>`;
    $('[data-filter="cat"]').innerHTML = chip('cat', 'all', 'Все') +
      Object.entries(CATEGORIES).map(([k, v]) => chip('cat', k, v)).join('');
    $('[data-filter="tech"]').innerHTML = chip('tech', 'all', 'Любая техника') +
      Object.entries(TECHNIQUES).map(([k, v]) => chip('tech', k, v)).join('');
  }

  function renderGrid() {
    const list = PRODUCTS.filter((p) => (state.cat === 'all' || p.cat === state.cat) && (state.tech === 'all' || p.tech === state.tech));
    grid.innerHTML = list.length ? list.map((p) => `
      <button class="card" type="button" data-product="${p.id}">
        ${placeholder(p)}
        <span class="card__title">${title(p)}</span>
        <span class="card__spec">${spec(p)}</span>
        <ul class="prices" aria-label="Цены">
          <li><i class="dot dot--retail"></i>${money(p.prices[0])}</li>
          <li><i class="dot dot--20"></i>${money(p.prices[1])}</li>
          <li><i class="dot dot--50"></i>${money(p.prices[2])}</li>
        </ul>
      </button>`).join('') : '<p class="empty">В этой категории нет изделий такой техники — попробуйте другую.</p>';
  }

  $('.filters').addEventListener('click', (e) => {
    const b = e.target.closest('.chip');
    if (!b) return;
    state[b.dataset.key] = b.dataset.val;
    renderChips();
    renderGrid();
  });

  /* ---------- Модалка товара ---------- */
  const modal = $('[data-modal]');
  function openProduct(id) {
    const p = byId.get(id);
    $('[data-modal-body]').innerHTML = `
      ${placeholder(p)}
      <div class="modal__info">
        <p class="eyebrow">${esc(CATEGORIES[p.cat])}</p>
        <h3>${title(p)}</h3>
        <dl class="specs">
          <dt>Номер</dt><dd>№${p.id}</dd>
          ${p.ml ? `<dt>Объём</dt><dd>${p.ml} мл</dd>` : ''}
          <dt>Размер</dt><dd>Ø ${esc(p.d)} см${p.h ? `, высота ${String(p.h).replace('.', ',')} см` : ''}</dd>
          <dt>Техника</dt><dd>${esc(TECHNIQUES[p.tech])}</dd>
          <dt>Глазурь</dt><dd>на выбор, <a href="#glazes" data-close>26 цветов</a></dd>
        </dl>
        <div class="tiers">
          <div class="tier"><b>${money(p.prices[0])}</b>розница</div>
          <div class="tier"><b>${money(p.prices[1])}</b>от 20 шт</div>
          <div class="tier"><b>${money(p.prices[2])}</b>от 50 шт</div>
        </div>
        <button class="btn" type="button" data-add="p${p.id}">Добавить в запрос</button>
      </div>`;
    modal.showModal();
  }
  grid.addEventListener('click', (e) => {
    const c = e.target.closest('[data-product]');
    if (c) openProduct(Number(c.dataset.product));
  });
  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.closest('[data-close]')) modal.close();
  });

  /* ---------- Подарочные наборы ---------- */
  const setTotal = (s, tier) => s.items.reduce((sum, id) => sum + byId.get(id).prices[tier], 0);
  const GLAZE_TONE = { espresso: '#5a3a2a', sand: '#c9b18e', cream: '#efe6d3', ochre: '#ad904e', clay: '#7b4a39', rust: '#702913', slate: '#657278' };

  function setBox(s) {
    const n = s.items.length;
    const cols = n === 1 ? 1 : 2;
    const cells = s.items.map((id, i) => {
      const p = byId.get(id);
      const span = n === 3 && i === 2 ? ';grid-column:span 2' : '';
      return `<div class="box__cell" style="color:${GLAZE_TONE[s.tone[i % 2]]}${span}">${icon(p.icon)}</div>`;
    }).join('');
    return `<div class="box" aria-hidden="true">
      <div class="box__cells" style="grid-template-columns:repeat(${cols},1fr)">${cells}</div>
    </div>`;
  }

  function renderSets() {
    $('[data-sets]').innerHTML = SETS.map((s) => {
      const counts = s.items.reduce((m, id) => m.set(id, (m.get(id) || 0) + 1), new Map());
      const list = [...counts].map(([id, q]) => {
        const p = byId.get(id);
        return `<li>${esc(p.name)}${p.ml ? `, ${p.ml} мл` : `, Ø ${esc(p.d)} см`}${q > 1 ? ` × ${q}` : ''}</li>`;
      }).join('');
      return `<article class="set">
        ${setBox(s)}
        <div class="set__body">
          <h3>${esc(s.name)}</h3>
          <p>${esc(s.text)}</p>
          <ul class="set__list">${list}</ul>
          <div class="set__foot">
            <span class="price-from">от ${money(setTotal(s, 2))}<small>розница ${money(setTotal(s, 0))}</small></span>
            <button class="btn btn--small" type="button" data-add="s-${s.id}">В запрос</button>
          </div>
        </div>
      </article>`;
    }).join('');
  }

  /* ---------- Глазури и глина ---------- */
  function renderGlazes() {
    $('[data-glazes]').innerHTML = Object.entries(GLAZES).map(([group, list]) => `
      <div class="glaze-group">
        <h3>${esc(group)}</h3>
        <div class="glazes">
          ${list.map(([name, hex]) => `<div class="glaze${group === 'Эффектные' ? ' glaze--fx' : ''}"><i style="background:${hex}"></i>${esc(name)}</div>`).join('')}
        </div>
      </div>`).join('') +
      '<p class="glaze-note">* Разработка индивидуального цвета под ваш брендбук — 35 000 ₸.</p>';
    $('[data-clays]').innerHTML = CLAYS.map(([name, hex]) => `<li><i style="background:${hex}"></i>${esc(name)}</li>`).join('');
  }

  /* ---------- Запрос КП ---------- */
  const KEY = 'kyn-request';
  let cart = [];
  try { cart = JSON.parse(localStorage.getItem(KEY)) || []; } catch { cart = []; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch { /* приватный режим */ } };

  function describe(key) {
    if (key.startsWith('s-')) {
      const s = SETS.find((x) => x.id === key.slice(2));
      return s && { name: `Набор «${s.name}»`, sub: `от ${money(setTotal(s, 2))}`, icon: 'sun', tone: ['t-espresso', 'c-sand'] };
    }
    const p = byId.get(Number(key.slice(1)));
    return p && { name: `№${p.id} ${p.name}${p.note ? ` (${p.note})` : ''}`, sub: spec(p), icon: p.icon, tone: tone(p.id) };
  }

  function renderCart() {
    cart = cart.filter((r) => describe(r.key));
    const total = cart.reduce((n, r) => n + r.qty, 0);
    $$('[data-count]').forEach((b) => { b.textContent = total; b.hidden = !total; });
    $('[data-cart]').innerHTML = cart.length ? cart.map((r, i) => {
      const d = describe(r.key);
      return `<div class="cart__row">
        <span class="cart__thumb ${d.tone[0]} ${d.tone[1]}">${icon(d.icon)}</span>
        <span class="cart__name">${esc(d.name)}<small>${esc(d.sub)}</small></span>
        <span class="qty">
          <button type="button" data-qty="${i}" data-d="-1" aria-label="Меньше">−</button>
          <input type="number" min="1" value="${r.qty}" data-qty-input="${i}" aria-label="Количество">
          <button type="button" data-qty="${i}" data-d="1" aria-label="Больше">+</button>
        </span>
        <button class="remove" type="button" data-remove="${i}" aria-label="Убрать">×</button>
      </div>`;
    }).join('') : '<p class="cart__empty">Пока пусто. Выберите изделия в каталоге или готовый набор.</p>';
  }

  const toastEl = $('[data-toast]');
  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), 2200);
  }

  document.addEventListener('click', (e) => {
    const add = e.target.closest('[data-add]');
    if (add) {
      const key = add.dataset.add;
      const row = cart.find((r) => r.key === key);
      const step = key.startsWith('s-') ? 1 : 20;
      if (row) row.qty += step; else cart.push({ key, qty: step });
      save(); renderCart();
      toast(`${describe(key).name} — в запросе`);
      if (modal.open) modal.close();
      return;
    }
    const q = e.target.closest('[data-qty]');
    if (q) {
      const r = cart[q.dataset.qty];
      r.qty = Math.max(1, r.qty + Number(q.dataset.d));
      save(); renderCart(); return;
    }
    const rm = e.target.closest('[data-remove]');
    if (rm) { cart.splice(Number(rm.dataset.remove), 1); save(); renderCart(); }
  });
  $('[data-cart]').addEventListener('change', (e) => {
    const i = e.target.dataset.qtyInput;
    if (i === undefined) return;
    cart[i].qty = Math.max(1, parseInt(e.target.value, 10) || 1);
    save(); renderCart();
  });

  $('[data-form]').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const lines = [
      'Запрос КП — KYN',
      `Имя: ${f.get('name')}`,
      f.get('company') && `Компания: ${f.get('company')}`,
      `Контакт: ${f.get('contact')}`,
      f.get('qty') && `Общий тираж: ${f.get('qty')} шт`,
      cart.length && '',
      cart.length && 'Позиции:',
      ...cart.map((r) => `— ${describe(r.key).name} × ${r.qty}`),
      f.get('comment') && '',
      f.get('comment') && `Комментарий: ${f.get('comment')}`,
    ].filter((l) => l !== false && l !== null && l !== undefined && l !== 0);
    const text = lines.join('\n');
    const via = e.submitter?.dataset.send || 'whatsapp';
    const url = via === 'email'
      ? `mailto:${CONTACTS.email}?subject=${encodeURIComponent('Запрос КП — KYN')}&body=${encodeURIComponent(text)}`
      : `https://wa.me/${CONTACTS.whatsapp}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener');
  });

  /* ---------- Контакты, меню ---------- */
  $('[data-contacts]').innerHTML = `
    <li><a href="tel:${CONTACTS.phone.replace(/\s/g, '')}">${esc(CONTACTS.phone)}</a></li>
    <li><a href="https://wa.me/${CONTACTS.whatsapp}" target="_blank" rel="noopener">WhatsApp</a></li>
    <li><a href="mailto:${CONTACTS.email}">${esc(CONTACTS.email)}</a></li>
    <li><a href="https://instagram.com/${CONTACTS.instagram}" target="_blank" rel="noopener">Instagram @${esc(CONTACTS.instagram)}</a></li>
    <li>${esc(CONTACTS.city)}</li>`;
  $('[data-year]').textContent = new Date().getFullYear();

  const burger = $('.burger');
  const nav = $('#nav');
  burger.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', open);
  });
  nav.addEventListener('click', (e) => {
    if (e.target.closest('a')) { nav.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); }
  });

  renderChips();
  renderGrid();
  renderSets();
  renderGlazes();
  renderCart();
})();
