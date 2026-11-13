
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer:fine)').matches;

  /* 1. Judul hero: muncul kata demi kata */
  document.querySelectorAll('.split-words').forEach(el => {
    const words = el.innerHTML.trim().split(/\s+/);
    el.innerHTML = words
      .map((w, i) => `<span class="w"><span style="animation-delay:${120 + i * 80}ms">${w}</span></span>`)
      .join(' ');
  });

  /* 2. Reveal saat scroll */
  const revealIO = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const delay = +el.dataset.delay || 0;
      el.style.transitionDelay = delay + 'ms';
      el.classList.add('is-visible');
      revealIO.unobserve(el);
      // bersihkan agar efek hover tidak terganggu
      setTimeout(() => { el.removeAttribute('data-reveal'); el.style.transitionDelay = ''; }, 1000 + delay);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('[data-reveal]').forEach(el => revealIO.observe(el));

  /* 3. Scroll: navbar, progress bar, tombol ke atas, timeline */
  const nav = document.getElementById('navWrap');
  const progress = document.getElementById('scrollProgress');
  const toTop = document.getElementById('toTop');
  const timeline = document.getElementById('timeline');
  let lastY = window.scrollY, ticking = false;

  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    nav.classList.toggle('is-scrolled', y > 20);
    // navbar sticky — tidak lagi disembunyikan saat scroll ke bawah
    toTop.classList.toggle('is-on', y > 700);

    if (timeline) {
      const r = timeline.getBoundingClientRect();
      const p = (window.innerHeight * 0.6 - r.top) / r.height;
      timeline.style.setProperty('--progress', Math.max(0, Math.min(1, p)).toFixed(3));
    }
    lastY = y;
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  /* 4. Menu aktif sesuai section yang sedang terlihat */
  const links = [...document.querySelectorAll('#navLinks a')];
  const spyIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  document.querySelectorAll('main section[id]').forEach(s => spyIO.observe(s));

  /* 5. Efek mengetik peran */
  const typed = document.getElementById('typedRole');
  const roles = ['UI Designer', 'Web Developer', 'Brand Designer', 'Pemburu detail'];
  if (typed && !reduceMotion) {
    let r = 0, c = roles[0].length, deleting = true;
    const tick = () => {
      const word = roles[r];
      c += deleting ? -1 : 1;
      typed.textContent = word.slice(0, c) || ' ';
      let wait = deleting ? 45 : 95;
      if (!deleting && c === word.length) { deleting = true; wait = 1800; }
      else if (deleting && c === 0) { deleting = false; r = (r + 1) % roles.length; wait = 250; }
      setTimeout(tick, wait);
    };
    setTimeout(tick, 2600);
  }

  /* 6. Tilt 3D & tombol magnetik (hanya mouse) */
  if (!reduceMotion && finePointer) {
    document.querySelectorAll('[data-tilt]').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(900px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
    document.querySelectorAll('.magnetic').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        btn.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px) scale(1.04)`;
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });
  }

  /* 7. Counter angka */
  const countIO = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.querySelectorAll('[data-count]').forEach(el => {
      const target = +el.dataset.count;
      const dur = reduceMotion ? 1 : 1600;
      const t0 = performance.now();
      const step = now => {
        const p = Math.min((now - t0) / dur, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 4)));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
    countIO.unobserve(entry.target);
  }), { threshold: 0.4 });
  document.querySelectorAll('.stats').forEach(el => countIO.observe(el));

  /* 8. Bar keahlian terisi saat terlihat */
  const skillCard = document.getElementById('skillCard');
  if (skillCard) {
    new IntersectionObserver((es, o) => es.forEach(e => {
      if (e.isIntersecting) { skillCard.classList.add('is-filled'); o.disconnect(); }
    }), { threshold: 0.4 }).observe(skillCard);
  }

  /* 9. Filter proyek dengan animasi */
  const filters = document.querySelectorAll('.filter');
  const projects = document.querySelectorAll('.project');
  filters.forEach(btn => btn.addEventListener('click', () => {
    filters.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const f = btn.dataset.filter;
    projects.forEach(p => {
      const show = f === 'all' || p.dataset.cat === f;
      if (show) {
        p.classList.remove('is-hidden');
        requestAnimationFrame(() => requestAnimationFrame(() => p.classList.remove('is-hiding')));
      } else {
        p.classList.add('is-hiding');
        setTimeout(() => { if (p.classList.contains('is-hiding')) p.classList.add('is-hidden'); }, 400);
      }
    });
  }));

  /* 10. Modal detail proyek diisi dari data-* kartu */
  const modal = document.getElementById('projectModal');
  modal.addEventListener('show.bs.modal', e => {
    const card = e.relatedTarget;
    if (!card) return;
    const d = card.dataset;
    document.getElementById('pmTitle').textContent = d.title;
    document.getElementById('pmDesc').textContent = d.desc;
    document.getElementById('pmTools').textContent = d.tools;
    document.getElementById('pmTag').textContent = d.tag;
    const hero = document.getElementById('pmHero');
    hero.style.setProperty('--t1', d.t1);
    hero.style.setProperty('--t2', d.t2);
  });
  // buka modal dengan keyboard (Enter/Spasi)
  document.querySelectorAll('.project-card').forEach(card => card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); bootstrap.Modal.getOrCreateInstance(modal).show(card); }
  }));

  /* 11. Tahun footer */
  document.getElementById('year').textContent = new Date().getFullYear();
})();

/* Toast kecil */
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('is-on');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => t.classList.remove('is-on'), 2400);
}

/* Salin email */
function copyText(text) {
  const done = () => showToast('Email tersalin: ' + text);
  if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, done); else done();
}

/* Form kontak (demo — sambungkan ke Formspree/EmailJS/backend sendiri) */
function sendMessage(e, form) {
  e.preventDefault();
  let ok = true;
  form.querySelectorAll('[required]').forEach(f => {
    const valid = f.checkValidity() && f.value.trim() !== '';
    f.classList.toggle('is-invalid', !valid);
    if (!valid) ok = false;
  });
  if (!ok) {
    form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake');
    return false;
  }
  const btn = form.querySelector('button[type=submit]');
  const label = btn.querySelector('.btn-label');
  btn.disabled = true;
  label.textContent = 'Mengirim…';
  setTimeout(() => {
    btn.disabled = false;
    label.textContent = 'Kirim pesan';
    form.reset();
    showToast('Terima kasih! Pesanmu sudah terkirim 🎉');
  }, 1200);
  return false;
}
document.addEventListener('input', e => {
  if (e.target.matches('.contact-form .is-invalid') && e.target.value.trim()) e.target.classList.remove('is-invalid');
});
