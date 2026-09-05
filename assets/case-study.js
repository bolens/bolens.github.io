const routeLinks = [...document.querySelectorAll('.case-route a[href^="#"]')];
const sections = routeLinks
  .map((link) => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);
const sectionIndex = new Map(sections.map((section, index) => [section.id, index]));
const linksById = new Map(routeLinks.map((link) => [link.getAttribute('href').slice(1), link]));

function setActiveSection(id) {
  const activeIndex = sectionIndex.get(id) ?? -1;

  for (const link of routeLinks) {
    const linkIndex = routeLinks.indexOf(link);
    const active = link.getAttribute('href') === `#${id}`;
    if (active) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
    link.toggleAttribute('data-visited', linkIndex <= activeIndex);
  }

  for (const section of sections) {
    section.classList.toggle('is-active', section.id === id);
  }

  const route = document.querySelector('.case-route');
  if (route && activeIndex >= 0) {
    route.style.setProperty('--case-progress', activeIndex / Math.max(sections.length - 1, 1));
  }
}

if (routeLinks.length && sections.length) {
  const initialId = sections.some((section) => section.id === location.hash.slice(1))
    ? location.hash.slice(1)
    : sections[0].id;

  setActiveSection(initialId);

  for (const link of routeLinks) {
    link.addEventListener('click', () => setActiveSection(link.getAttribute('href').slice(1)));
  }

  let frame;
  const updateFromScroll = () => {
    frame = undefined;
    const readingLine = innerHeight * .38;
    const current = sections.reduce((active, section) =>
      section.getBoundingClientRect().top <= readingLine ? section : active, sections[0]);
    setActiveSection(current.id);
  };
  const scheduleHashAlignment = (id) => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        frame = undefined;
        if (location.hash.slice(1) !== id) return;
        document.getElementById(id)?.scrollIntoView();
        setActiveSection(id);
      });
    });
  };

  addEventListener('scroll', () => {
    if (!frame) frame = requestAnimationFrame(updateFromScroll);
  }, { passive: true });
  addEventListener('resize', () => {
    // The pending callback will read the latest viewport. Do not discard
    // its handle while a hash alignment or scroll update still owns it.
    if (frame !== undefined) return;
    updateFromScroll();
  });
  addEventListener('hashchange', () => {
    const id = location.hash.slice(1);
    if (sections.some((section) => section.id === id)) {
      setActiveSection(id);
      scheduleHashAlignment(id);
    }
  });
  if (location.hash) scheduleHashAlignment(initialId);
  else frame = requestAnimationFrame(updateFromScroll);
}
