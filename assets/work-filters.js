(() => {
  const list = document.querySelector('.index-list');
  const tools = document.querySelector('.work-tools');
  if (!list || !tools) return;

  const items = [...list.querySelectorAll(':scope > a')];
  const search = tools.querySelector('[name="project-search"]');
  const language = tools.querySelector('[name="project-language"]');
  const kind = tools.querySelector('[name="project-kind"]');
  const sort = tools.querySelector('[name="project-sort"]');
  const reset = tools.querySelector('.work-reset');
  const results = tools.querySelector('.work-results');
  const updatedOption = sort.querySelector('[value="updated"]');
  const collator = new Intl.Collator(undefined, { sensitivity: 'base' });
  tools.hidden = false;

  items.forEach((item, index) => { item.dataset.projectOrder = index; });
  const languages = [...new Set(items.flatMap((item) => item.dataset.projectLanguages.split('·').map((value) => value.trim())))].sort(collator.compare);
  language.insertAdjacentHTML('beforeend', languages.map((value) => `<option value="${value.toLowerCase()}">${value}</option>`).join(''));

  const params = new URLSearchParams(location.search);
  search.value = params.get('q') ?? '';
  language.value = params.get('language') ?? '';
  kind.value = params.get('type') ?? '';
  sort.value = params.get('sort') ?? 'featured';
  if (!sort.value) sort.value = 'featured';

  const updateUrl = () => {
    const next = new URLSearchParams();
    if (search.value.trim()) next.set('q', search.value.trim());
    if (language.value) next.set('language', language.value);
    if (kind.value) next.set('type', kind.value);
    if (sort.value !== 'featured') next.set('sort', sort.value);
    history.replaceState(null, '', `${location.pathname}${next.size ? `?${next}` : ''}${location.hash}`);
  };

  const apply = () => {
    const query = search.value.trim().toLowerCase();
    const visible = items.filter((item) => {
      const text = item.textContent.toLowerCase();
      const matches = (!query || text.includes(query))
        && (!language.value || item.dataset.projectLanguages.toLowerCase().split('·').map((value) => value.trim()).includes(language.value))
        && (!kind.value || item.dataset.projectKind === kind.value);
      item.hidden = !matches;
      return matches;
    });
    const ordered = [...items].sort((left, right) => {
      if (sort.value === 'name-asc') return collator.compare(left.dataset.projectName, right.dataset.projectName);
      if (sort.value === 'name-desc') return collator.compare(right.dataset.projectName, left.dataset.projectName);
      if (sort.value === 'updated') return Number(right.dataset.projectUpdated ?? 0) - Number(left.dataset.projectUpdated ?? 0) || Number(left.dataset.projectOrder) - Number(right.dataset.projectOrder);
      return Number(left.dataset.projectOrder) - Number(right.dataset.projectOrder);
    });
    ordered.forEach((item) => list.append(item));
    results.textContent = visible.length ? `Showing ${visible.length} of ${items.length} projects.` : 'No projects match those filters.';
    list.classList.toggle('is-empty', visible.length === 0);
    updateUrl();
  };

  tools.addEventListener('input', apply);
  tools.addEventListener('change', apply);
  reset.addEventListener('click', () => {
    search.value = '';
    language.value = '';
    kind.value = '';
    sort.value = 'featured';
    apply();
    search.focus();
  });

  const setUpdatedDates = (repositories) => {
    const byUrl = new Map(repositories.map((repository) => [repository.html_url.toLowerCase(), repository]));
    let matched = 0;
    items.forEach((item) => {
      const repository = byUrl.get(item.dataset.projectRepository.toLowerCase());
      const updated = repository?.pushed_at ?? repository?.updated_at;
      if (!updated) return;
      item.dataset.projectUpdated = Date.parse(updated);
      let time = item.querySelector('.project-updated');
      if (!time) {
        time = document.createElement('time');
        time.className = 'project-updated';
        item.querySelector('span').append(time);
      }
      time.dateTime = updated;
      time.textContent = `Updated ${new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(updated))}`;
      matched += 1;
    });
    if (matched) {
      updatedOption.textContent = 'Recently updated';
      tools.dataset.updates = 'live';
      apply();
    }
  };

  apply();
  const cacheKey = 'portfolio-project-updates-v1';
  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey) ?? 'null');
    if (cached?.repositories) setUpdatedDates(cached.repositories);
    if (cached && Date.now() - cached.savedAt < 10 * 60 * 1000) return;
  } catch {}

  fetch('https://api.github.com/users/bolens/repos?per_page=100&sort=updated', { headers: { Accept: 'application/vnd.github+json' } })
    .then((response) => {
      if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
      return response.json();
    })
    .then((repositories) => {
      setUpdatedDates(repositories);
      try { localStorage.setItem(cacheKey, JSON.stringify({ savedAt: Date.now(), repositories })); } catch {}
    })
    .catch(() => {
      if (!items.some((item) => item.dataset.projectUpdated)) {
        updatedOption.disabled = true;
        updatedOption.textContent = 'Recently updated · unavailable';
        if (sort.value === 'updated') sort.value = 'featured';
        apply();
      }
    });
})();
