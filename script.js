/* =========================
   BCWbruxelles — script.js
   - Menu mobile (burger)
   - Scroll doux sur les ancres (#offres, #matieres, #equipe)
   - Année automatique dans le footer
   ========================= */

const burger = document.querySelector('.burger');
const nav = document.querySelector('header nav');

// Ouvrir/fermer le menu mobile
if (burger && nav) {
  burger.addEventListener('click', () => {
    nav.classList.toggle('open');
    burger.setAttribute('aria-expanded', nav.classList.contains('open') ? 'true' : 'false');
  });
}

// Scroll doux sur les liens du style href="#offres"
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    const el = document.querySelector(id);
    if (!el) return;

    e.preventDefault();
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // On ferme le menu mobile après clic
    if (nav) nav.classList.remove('open');
    if (burger) burger.setAttribute('aria-expanded', 'false');
  });
});

// Année automatique dans le footer si l'élément existe
const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();