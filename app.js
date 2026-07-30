/* The complete editable source is content/site-content.md. */
const COURSE_CONTENT_URL = 'content/course.md';
let courseData;

const $ = (selector, scope = document) => scope.querySelector(selector);
const escapeHTML = (value = '') => String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
const titleize = value => value.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase());

function parseCourseMarkdown(markdown) {
  const match = markdown.match(/```json\s*\n([\s\S]*?)\n```/i);
  if (!match) throw new Error('The editable JSON block is missing from content/course.md.');
  return JSON.parse(match[1]);
}

async function getText(url) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Could not load ${url}.`);
  return response.text();
}

async function loadCourseData() {
  return parseCourseMarkdown(await getText(COURSE_CONTENT_URL));
}

function uiValue(key, fallback = '') { return key.split('.').reduce((value, part) => value?.[part], courseData?.ui) ?? fallback; }
function text(key, fallback = '') { return escapeHTML(uiValue(key, fallback)); }
function eventTypeLabel(type) { return text(`eventTypes.${type}`, titleize(type)); }
function routeLink(route, labelKey, fallback) { return `<a href="#${route}" data-route="${route}">${text(labelKey, fallback)}</a>`; }
function pageHeader(page) { return `<header class="page-header"><p class="eyebrow">${text(`pages.${page}.eyebrow`)}</p><h1 class="page-title">${text(`pages.${page}.title`)}</h1><p class="page-intro">${text(`pages.${page}.intro`)}</p></header>`; }
function emptyState() { return `<div class="empty-state"><p>${text('empty.title')}</p><span>${text('empty.intro')}</span></div>`; }
function eventCard(event) {
  return `<article class="event-card ${escapeHTML(event.type)}"><div class="event-kind">${eventTypeLabel(event.type)}</div><div><h3>${escapeHTML(event.title)}</h3><p>${escapeHTML(event.description)}</p><div class="event-meta">${escapeHTML(event.date)} · ${escapeHTML(event.time)} · ${escapeHTML(event.room)}</div></div></article>`;
}
function deadlineCard(event) {
  const bits = event.date.split(' ');
  return `<article class="deadline"><div class="date"><strong>${escapeHTML(bits[0])}</strong>${escapeHTML(bits.slice(1).join(' '))}</div><div><h3>${escapeHTML(event.title)}</h3><p>${escapeHTML(event.description)}</p></div><span class="pill">${escapeHTML(event.time)}</span></article>`;
}
function announcementCard(item) { return `<article class="notice-card ${item.pinned ? 'pinned' : ''}"><div class="notice-meta">${item.pinned ? `${text('labels.pinned')} · ` : ''}${escapeHTML(item.date)}</div><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.body)}</p></article>`; }
function guestCard(guest) {
  return `<article class="guest-card"><img class="guest-portrait" src="${escapeHTML(guest.portrait)}" alt="${text('labels.portraitOf')} ${escapeHTML(guest.name)}"><div class="guest-card-body"><p class="guest-role">${escapeHTML(guest.role)} · ${escapeHTML(guest.company)}</p><h3>${escapeHTML(guest.name)}</h3><p>${escapeHTML(guest.lectureTitle)}</p><div class="guest-links"><button class="card-expand" data-guest="${escapeHTML(guest.id)}">${text('buttons.fullProfile')}</button></div></div></article>`;
}
function briefCard(brief) {
  return `<article class="brief-card" data-brief="${escapeHTML(brief.id)}"><div class="card-topline"><span class="tag">${escapeHTML(brief.category)}</span><span class="tag">${escapeHTML(brief.workload)}</span></div><h3>${escapeHTML(brief.title)}</h3><p>${escapeHTML(brief.shortDescription)}</p><button class="card-expand" data-brief="${escapeHTML(brief.id)}">${text('buttons.readFullBrief')}</button></article>`;
}
function scenarioCard(scenario) {
  return `<article class="scenario-card" data-scenario="${escapeHTML(scenario.id)}"><div class="card-topline"><span class="tag">${escapeHTML(scenario.category)}</span><span class="tag">${escapeHTML(scenario.workload)}</span></div><h3>${escapeHTML(scenario.title)}</h3><p>${escapeHTML(scenario.shortDescription)}</p><button class="card-expand" data-scenario="${escapeHTML(scenario.id)}">${text('buttons.openScenario')}</button></article>`;
}
function faq(items = []) { return `<section class="faq"><div class="section-heading"><h2>${text('labels.faq')}</h2></div>${items.map(item => `<details><summary>${escapeHTML(item.question)}</summary><p>${escapeHTML(item.answer)}</p></details>`).join('')}</section>`; }

function renderDashboard() {
  const sessions = courseData.schedule.flatMap(week => week.events);
  const eventDate = event => {
    const parsed = parseCourseDate(event.date);
    return parsed ? new Date(courseData.course.calendarYear, parsed.month, parsed.day) : null;
  };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextSession = sessions.find(event => eventDate(event) >= today) || sessions[0];
  const firstSession = sessions[0];
  const lastSession = sessions.at(-1);
  const coursePeriod = firstSession && lastSession ? `${firstSession.date}–${lastSession.date}` : '';

  return `<section class="course-overview"><header class="overview-header"><p class="eyebrow">${escapeHTML(courseData.course.term)} · ${text('labels.courseHandbook')}</p><h1>${escapeHTML(courseData.course.title)}</h1><p>${escapeHTML(courseData.course.description)}</p></header>
  <section class="next-session" aria-labelledby="next-session-title"><div><p class="eyebrow" id="next-session-title">${text('dashboard.nextSession')}</p><h2>${escapeHTML(nextSession?.title || uiValue('dashboard.noSessions'))}</h2><p>${escapeHTML(nextSession?.description || '')}</p></div><dl><div><dt>${text('dashboard.date')}</dt><dd>${escapeHTML(nextSession?.date || '—')}</dd></div><div><dt>${text('dashboard.time')}</dt><dd>${escapeHTML(nextSession?.time || '—')}</dd></div><div><dt>${text('dashboard.room')}</dt><dd>${escapeHTML(nextSession?.room || '—')}</dd></div></dl></section>
  <section class="course-facts" aria-label="${text('dashboard.courseOverview')}"><div><dt>${text('dashboard.coursePeriod')}</dt><dd>${escapeHTML(coursePeriod)}</dd></div><div><dt>${text('dashboard.teachingSessions')}</dt><dd>${sessions.length}</dd></div><div><dt>${text('dashboard.courseWeeks')}</dt><dd>${courseData.schedule.length}</dd></div></section>
  <section class="schedule-overview"><div class="section-heading"><h2>${text('dashboard.scheduleOverview')}</h2>${routeLink('schedule', 'dashboard.openFullSchedule')}</div><div class="week-overview-grid">${courseData.schedule.map(week => `<article class="week-overview-card"><p class="eyebrow">${text('labels.week')} ${String(week.week).padStart(2, '0')}</p><h3>${escapeHTML(week.title)}</h3><p>${escapeHTML(week.dateRange)}</p><span>${week.events.length} ${text('dashboard.sessions')}</span></article>`).join('')}</div></section></section>`;
}
function parseCourseDate(value) {
  const [day, monthName] = value.split(' ');
  const month = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].indexOf(monthName);
  return month < 0 ? null : { day: Number(day), month };
}
function calendarMonth(year, month) {
  const events = courseData.schedule.flatMap(week => week.events.map(event => ({ ...event, week: week.week }))).filter(event => parseCourseDate(event.date)?.month === month);
  const days = new Date(year, month + 1, 0).getDate();
  const start = (new Date(year, month, 1).getDay() + 6) % 7;
  const cells = Array.from({ length: start + days }, (_, index) => {
    const day = index - start + 1;
    if (index < start) return '<div class="calendar-cell empty"></div>';
    const items = events.filter(event => parseCourseDate(event.date).day === day);
    return `<div class="calendar-cell"><span class="calendar-date">${day}</span>${items.map(event => `<article class="calendar-event ${escapeHTML(event.type)}"><small>${eventTypeLabel(event.type)} · ${escapeHTML(event.time)}</small>${escapeHTML(event.title)}</article>`).join('')}</div>`;
  });
  while (cells.length % 7) cells.push('<div class="calendar-cell empty"></div>');
  return `<section class="calendar-month"><header class="calendar-month-title"><h2>${text(`calendar.months.${month}`)}</h2><span>${year}</span></header><div class="calendar-grid">${courseData.ui.calendar.weekdays.map(day => `<div class="calendar-day-name">${escapeHTML(day)}</div>`).join('')}${cells.join('')}</div></section>`;
}
function renderSchedule() {
  const months = [...new Set(courseData.schedule.flatMap(week => week.events.map(event => parseCourseDate(event.date)?.month)).filter(Number.isInteger))].sort((a, b) => a - b);
  const guestSection = courseData.guestLecturers.length ? `<section style="margin-top:54px"><div class="section-heading"><h2>${text('labels.guestLecturers')}</h2></div><div class="guest-grid">${courseData.guestLecturers.map(guestCard).join('')}</div></section>` : '';
  return `${pageHeader('schedule')}
  <div class="calendar-legend"><span class="calendar-event lecture">${eventTypeLabel('lecture')}</span><span class="calendar-event workshop">${text('eventTypes.workshopLab')}</span><span class="calendar-event guest-lecture">${eventTypeLabel('guest-lecture')}</span><span class="calendar-event deadline">${eventTypeLabel('deadline')}</span></div><section class="calendar-wrap">${months.map(month => calendarMonth(courseData.course.calendarYear, month)).join('')}</section>
  <section class="timeline">${courseData.schedule.map((week, index) => `<details class="week" ${index === 0 ? 'open' : ''}><summary><span class="week-number">${text('labels.week')} ${String(week.week).padStart(2, '0')}</span><h2>${escapeHTML(week.title)}</h2><span class="week-date">${escapeHTML(week.dateRange)}</span></summary><div class="week-body">${week.events.map(eventCard).join('')}</div></details>`).join('')}</section>
  ${guestSection}`;
}
function renderGroupProject() {
  const project = courseData.groupProject;
  return `${pageHeader('groupProject')}
  <div class="info-layout"><article class="rich-content"><h2>${text('labels.overview')}</h2><p>${escapeHTML(project.overview)}</p><h3>${text('labels.timeline')}</h3><ul>${project.timeline.map(item => `<li>${escapeHTML(item)}</li>`).join('')}</ul><h3>${text('labels.deliverables')}</h3><ul>${project.deliverables.map(item => `<li>${escapeHTML(item)}</li>`).join('')}</ul></article><aside class="info-card"><h3>${text('labels.assessment')}</h3><p>${escapeHTML(project.assessment)}</p></aside></div><section style="margin-top:54px"><div class="section-heading"><h2>${text('labels.projectScenarios')}</h2></div><div class="scenario-grid">${project.scenarios.map(scenarioCard).join('')}</div></section>${faq(project.faq)}`;
}
function renderFinalPortfolio() {
  const portfolio = courseData.finalPortfolio;
  return `${pageHeader('finalPortfolio')}
  <div class="info-layout"><article class="rich-content"><h2>${text('labels.overview')}</h2><p>${escapeHTML(portfolio.overview)}</p><h3>${text('labels.portfolioStructure')}</h3><ul>${portfolio.structure.map(item => `<li>${escapeHTML(item)}</li>`).join('')}</ul><h3>${text('labels.submission')}</h3><p>${escapeHTML(portfolio.submission)}</p></article><aside class="info-card"><h3>${text('labels.assessment')}</h3><p>${escapeHTML(portfolio.assessment)}</p><a class="button" href="#brief-library" data-route="brief-library" style="margin-top:18px">${text('buttons.browseBriefProjects')}</a></aside></div>${faq(portfolio.faq)}`;
}
function renderBriefLibrary() { return `${pageHeader('briefLibrary')}<div class="brief-grid">${courseData.portfolioBriefs.map(briefCard).join('')}</div>`; }
function renderResources() { return `${pageHeader('resources')}<div class="resource-grid">${courseData.resources.map(resource => `<article class="resource-card"><div class="resource-icon">${escapeHTML(resource.icon)}</div><span class="tag">${escapeHTML(resource.category)}</span><h3>${escapeHTML(resource.title)}</h3><p>${escapeHTML(resource.description)}</p><a class="button" href="${escapeHTML(resource.url)}" ${resource.url.startsWith('http') ? 'target="_blank" rel="noreferrer"' : ''}>${text('buttons.openResource')}</a></article>`).join('')}</div>`; }
function renderFeedback() { return `${pageHeader('feedback')}<section class="feedback-card"><h2>${text('feedback.heading')}</h2><p>${text('feedback.intro')}</p><div class="booking-placeholder"><strong>${text('feedback.bookingService')}</strong><br>${text('feedback.bookingInstructions')}<br><br><a class="button" href="${escapeHTML(courseData.course.bookingUrl)}" target="_blank" rel="noreferrer">${text('buttons.openBookingPage')}</a></div></section>${faq([{question: uiValue('feedback.faqBringQuestion'),answer:uiValue('feedback.faqBringAnswer')},{question:uiValue('feedback.faqSlotsQuestion'),answer:uiValue('feedback.faqSlotsAnswer').replace('{email}', courseData.course.feedbackEmail)}])}`; }

const renderers = { dashboard: renderDashboard, schedule: renderSchedule, 'group-project': renderGroupProject, 'final-portfolio': renderFinalPortfolio, 'brief-library': renderBriefLibrary, resources: renderResources, feedback: renderFeedback };
function hydrateStaticCopy() {
  document.querySelectorAll('[data-ui]').forEach(element => { element.textContent = uiValue(element.dataset.ui, element.textContent); });
  document.querySelectorAll('[data-ui-attribute]').forEach(element => {
    const [attribute, key] = element.dataset.uiAttribute.split(':');
    element.setAttribute(attribute, uiValue(key, element.getAttribute(attribute)));
  });
  document.title = uiValue('chrome.documentTitle', document.title);
}
function navigate(route = location.hash.slice(1) || 'dashboard') {
  const validRoute = renderers[route] ? route : 'dashboard';
  $('#app').innerHTML = renderers[validRoute]();
  $('#page-label').textContent = document.querySelector(`[data-route="${validRoute}"]`)?.textContent || 'Dashboard';
  document.querySelectorAll('.primary-nav a').forEach(link => link.classList.toggle('active', link.dataset.route === validRoute));
  window.scrollTo({ top: 0, behavior: 'smooth' });
  $('#app').focus({ preventScroll: true });
}
function showModal(content) { document.body.insertAdjacentHTML('beforeend', `<div class="modal" role="dialog" aria-modal="true"><div class="modal-panel"><button class="modal-close" aria-label="Close">×</button>${content}</div></div>`); $('.modal-close').focus(); }
function openBrief(id) { const brief = courseData.portfolioBriefs.find(item => item.id === id); if (!brief) return; showModal(`<span class="tag">${escapeHTML(brief.category)} · ${escapeHTML(brief.difficulty)}</span><h2>${escapeHTML(brief.title)}</h2><p>${escapeHTML(brief.description)}</p><h3>${text('labels.client')}</h3><p>${escapeHTML(brief.client)}</p><h3>${text('labels.background')}</h3><p>${escapeHTML(brief.background)}</p><h3>${text('labels.challenge')}</h3><p>${escapeHTML(brief.challenge)}</p><h3>${text('labels.goals')}</h3><ul>${brief.goals.map(goal => `<li>${escapeHTML(goal)}</li>`).join('')}</ul><h3>${text('labels.audience')}</h3><p>${escapeHTML(brief.audience)}</p><h3>${text('labels.creativeFreedom')}</h3><p>${escapeHTML(brief.creativeFreedom)}</p><h3>${text('labels.portfolioValue')}</h3><p>${escapeHTML(brief.portfolioValue)}</p>`); }
function openScenario(id) { const scenario = courseData.groupProject.scenarios.find(item => item.id === id); if (!scenario) return; showModal(`<span class="tag">${escapeHTML(scenario.category)}</span><h2>${escapeHTML(scenario.title)}</h2><p>${escapeHTML(scenario.brief)}</p><h3>${text('labels.skillsDeveloped')}</h3><ul>${scenario.skills.map(skill => `<li>${escapeHTML(skill)}</li>`).join('')}</ul><h3>${text('labels.estimatedWorkload')}</h3><p>${escapeHTML(scenario.workload)}</p>`); }
function openGuest(id) { const guest = courseData.guestLecturers.find(item => item.id === id); if (!guest) return; showModal(`<span class="tag">${text('eventTypes.guest-lecture')} · ${escapeHTML(guest.date)}</span><h2>${escapeHTML(guest.name)}</h2><p><strong>${escapeHTML(guest.role)}, ${escapeHTML(guest.company)}</strong></p><p>${escapeHTML(guest.bio)}</p><h3>${escapeHTML(guest.lectureTitle)}</h3><p>${escapeHTML(guest.lectureDescription)}</p><h3>${text('labels.learningOutcomes')}</h3><ul>${guest.learningOutcomes.map(outcome => `<li>${escapeHTML(outcome)}</li>`).join('')}</ul><h3>${text('labels.details')}</h3><p>${escapeHTML(guest.date)} · ${escapeHTML(guest.time)} · ${escapeHTML(guest.room)}</p><p><a href="${escapeHTML(guest.website)}" target="_blank" rel="noreferrer">${text('labels.website')}</a> · <a href="${escapeHTML(guest.instagram)}" target="_blank" rel="noreferrer">${text('labels.instagram')}</a> · <a href="${escapeHTML(guest.linkedin)}" target="_blank" rel="noreferrer">${text('labels.linkedin')}</a></p>`); }
document.addEventListener('click', event => {
  const route = event.target.closest('[data-route]'); if (route) { event.preventDefault(); location.hash = route.dataset.route; }
  const brief = event.target.closest('[data-brief]'); if (brief) openBrief(brief.dataset.brief);
  const scenario = event.target.closest('[data-scenario]'); if (scenario) openScenario(scenario.dataset.scenario);
  const guest = event.target.closest('[data-guest]'); if (guest) openGuest(guest.dataset.guest);
  if (event.target.matches('.modal, .modal-close')) $('.modal')?.remove();
  if (event.target.closest('.mobile-menu')) $('.sidebar').classList.toggle('open');
});
window.addEventListener('hashchange', () => navigate());
document.addEventListener('keydown', event => { if (event.key === 'Escape') $('.modal')?.remove(); });

loadCourseData().then(data => { courseData = data; hydrateStaticCopy(); navigate(); }).catch(error => { $('#app').innerHTML = `<div class="empty-state"><p>Course content could not load.</p><span>${escapeHTML(error.message)}</span></div>`; });
