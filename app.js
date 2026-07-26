/* Content adapter: replace only loadCourseData() when moving to a CMS/API. */
const DATA_URL = 'data.json';
const STORAGE_KEY = 'ccp-course-hub-data';
let courseData;

const $ = (selector, scope = document) => scope.querySelector(selector);
const escapeHTML = (value = '') => String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
const titleize = value => value.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase());

async function loadCourseData() {
  const localData = localStorage.getItem(STORAGE_KEY);
  if (localData) return JSON.parse(localData);
  const response = await fetch(DATA_URL);
  if (!response.ok) throw new Error('Could not load course data.');
  return response.json();
}

function routeLink(route, label) { return `<a href="#${route}" data-route="${route}">${label}</a>`; }
function pageHeader(eyebrow, title, intro) { return `<header class="page-header"><p class="eyebrow">${eyebrow}</p><h1 class="page-title">${title}</h1><p class="page-intro">${intro}</p></header>`; }
function emptyState() { return $('#empty-state').content.firstElementChild.outerHTML; }
function eventCard(event) {
  return `<article class="event-card ${escapeHTML(event.type)}"><div class="event-kind">${titleize(event.type)}</div><div><h3>${escapeHTML(event.title)}</h3><p>${escapeHTML(event.description)}</p><div class="event-meta">${escapeHTML(event.date)} · ${escapeHTML(event.time)} · ${escapeHTML(event.room)}</div></div></article>`;
}
function deadlineCard(event) {
  const bits = event.date.split(' ');
  return `<article class="deadline"><div class="date"><strong>${escapeHTML(bits[0])}</strong>${escapeHTML(bits.slice(1).join(' '))}</div><div><h3>${escapeHTML(event.title)}</h3><p>${escapeHTML(event.description)}</p></div><span class="pill">${escapeHTML(event.time)}</span></article>`;
}
function announcementCard(item) { return `<article class="notice-card ${item.pinned ? 'pinned' : ''}"><div class="notice-meta">${item.pinned ? 'Pinned · ' : ''}${escapeHTML(item.date)}</div><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.body)}</p></article>`; }
function guestCard(guest) {
  return `<article class="guest-card"><img class="guest-portrait" src="${escapeHTML(guest.portrait)}" alt="Portrait of ${escapeHTML(guest.name)}"><div class="guest-card-body"><p class="guest-role">${escapeHTML(guest.role)} · ${escapeHTML(guest.company)}</p><h3>${escapeHTML(guest.name)}</h3><p>${escapeHTML(guest.lectureTitle)}</p><div class="guest-links"><button class="card-expand" data-guest="${escapeHTML(guest.id)}">Full profile</button></div></div></article>`;
}
function briefCard(brief) {
  return `<article class="brief-card" data-brief="${escapeHTML(brief.id)}"><div class="card-topline"><span class="tag">${escapeHTML(brief.category)}</span><span class="tag">${escapeHTML(brief.workload)}</span></div><h3>${escapeHTML(brief.title)}</h3><p>${escapeHTML(brief.shortDescription)}</p><button class="card-expand" data-brief="${escapeHTML(brief.id)}">Read full brief ↗</button></article>`;
}
function scenarioCard(scenario) {
  return `<article class="scenario-card" data-scenario="${escapeHTML(scenario.id)}"><div class="card-topline"><span class="tag">${escapeHTML(scenario.category)}</span><span class="tag">${escapeHTML(scenario.workload)}</span></div><h3>${escapeHTML(scenario.title)}</h3><p>${escapeHTML(scenario.shortDescription)}</p><button class="card-expand" data-scenario="${escapeHTML(scenario.id)}">Open scenario ↗</button></article>`;
}
function faq(items = []) { return `<section class="faq"><div class="section-heading"><h2>Frequently asked questions</h2></div>${items.map(item => `<details><summary>${escapeHTML(item.question)}</summary><p>${escapeHTML(item.answer)}</p></details>`).join('')}</section>`; }

function renderDashboard() {
  const deadlines = courseData.schedule.flatMap(week => week.events).filter(event => event.type === 'deadline').slice(0, 3);
  const focus = courseData.schedule[0]?.events[0];
  return `<section class="dashboard-masthead"><div class="dashboard-masthead-copy"><div><p class="dashboard-masthead-meta">${escapeHTML(courseData.course.term)} · Course handbook</p><h1>Content<br>Creation<br>&amp; Portfolio</h1><p>${escapeHTML(courseData.course.description)}</p></div><div>${routeLink('brief-library', 'Enter the brief library →')}</div></div><div class="dashboard-image-grid"><figure><img src="assets/images/brief-hotel.svg" alt="A coastal hotel portfolio brief"></figure><figure><img src="assets/images/brief-eyewear.svg" alt="An independent eyewear portfolio brief"></figure><figure><img src="assets/images/brief-skincare.svg" alt="A premium skincare portfolio brief"></figure></div></section>
  <section class="dashboard-workbench"><article class="workbench-panel"><h2>This week</h2><div class="featured-session"><time>${escapeHTML(focus?.date || '')}</time><div><h3>${escapeHTML(focus?.title || 'Course updates')}</h3><p>${escapeHTML(focus?.description || '')}</p>${routeLink('schedule', 'Open calendar →')}</div></div></article><article class="workbench-panel"><h2>From the studio</h2><div class="dashboard-stack">${courseData.announcements.slice(0, 2).map(announcementCard).join('') || emptyState()}</div></article></section>
  <div class="dashboard-columns"><section><div class="section-heading"><h2>Upcoming deadlines</h2>${routeLink('schedule', 'Calendar')}</div><div class="deadline-list">${deadlines.map(deadlineCard).join('') || emptyState()}</div></section><section><div class="section-heading"><h2>Course rooms</h2></div><div class="quick-links">${routeLink('group-project', 'Group project <span>→</span>')}${routeLink('final-portfolio', 'Final portfolio <span>→</span>')}${routeLink('resources', 'Resources <span>→</span>')}${routeLink('feedback', 'Book feedback <span>→</span>')}</div></section></div>`;
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
    return `<div class="calendar-cell"><span class="calendar-date">${day}</span>${items.map(event => `<article class="calendar-event ${escapeHTML(event.type)}"><small>${escapeHTML(titleize(event.type))} · ${escapeHTML(event.time)}</small>${escapeHTML(event.title)}</article>`).join('')}</div>`;
  });
  while (cells.length % 7) cells.push('<div class="calendar-cell empty"></div>');
  return `<section class="calendar-month"><header class="calendar-month-title"><h2>${new Intl.DateTimeFormat('en', { month: 'long' }).format(new Date(year, month, 1))}</h2><span>${year}</span></header><div class="calendar-grid">${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day => `<div class="calendar-day-name">${day}</div>`).join('')}${cells.join('')}</div></section>`;
}
function renderSchedule() {
  return `${pageHeader('The semester', 'Course schedule', 'See every lecture, workshop, guest session and deadline in the calendar. Open a week below for its full details.')}
  <div class="calendar-legend"><span class="calendar-event lecture">Lecture</span><span class="calendar-event workshop">Workshop / lab</span><span class="calendar-event guest-lecture">Guest lecture</span><span class="calendar-event deadline">Deadline</span></div><section class="calendar-wrap">${[0, 1].map(month => calendarMonth(2026, month)).join('')}</section>
  <section class="timeline">${courseData.schedule.map((week, index) => `<details class="week" ${index === 0 ? 'open' : ''}><summary><span class="week-number">Week ${String(week.week).padStart(2, '0')}</span><h2>${escapeHTML(week.title)}</h2><span class="week-date">${escapeHTML(week.dateRange)}</span></summary><div class="week-body">${week.events.map(eventCard).join('')}</div></details>`).join('')}</section>
  <section style="margin-top:54px"><div class="section-heading"><h2>Guest lecturers</h2></div><div class="guest-grid">${courseData.guestLecturers.map(guestCard).join('')}</div></section>`;
}
function renderGroupProject() {
  const project = courseData.groupProject;
  return `${pageHeader('Studio collaboration', 'Group project', 'A concentrated team project that asks you to make a clear creative response together.')}
  <div class="info-layout"><article class="rich-content"><h2>Overview</h2><p>${escapeHTML(project.overview)}</p><h3>Timeline</h3><ul>${project.timeline.map(item => `<li>${escapeHTML(item)}</li>`).join('')}</ul><h3>Deliverables</h3><ul>${project.deliverables.map(item => `<li>${escapeHTML(item)}</li>`).join('')}</ul></article><aside class="info-card"><h3>Assessment</h3><p>${escapeHTML(project.assessment)}</p></aside></div><section style="margin-top:54px"><div class="section-heading"><h2>Project scenarios</h2></div><div class="scenario-grid">${project.scenarios.map(scenarioCard).join('')}</div></section>${faq(project.faq)}`;
}
function renderFinalPortfolio() {
  const portfolio = courseData.finalPortfolio;
  return `${pageHeader('Your point of view', 'Final portfolio', 'An edited, accessible record of your work and the creative practice you are building.')}
  <div class="info-layout"><article class="rich-content"><h2>Overview</h2><p>${escapeHTML(portfolio.overview)}</p><h3>Portfolio structure</h3><ul>${portfolio.structure.map(item => `<li>${escapeHTML(item)}</li>`).join('')}</ul><h3>Submission</h3><p>${escapeHTML(portfolio.submission)}</p></article><aside class="info-card"><h3>Assessment</h3><p>${escapeHTML(portfolio.assessment)}</p><a class="button" href="#brief-library" data-route="brief-library" style="margin-top:18px">Browse brief projects</a></aside></div>${faq(portfolio.faq)}`;
}
function renderBriefLibrary() { return `${pageHeader('Choose a direction', 'Portfolio brief library', 'Use one of these open briefs to create a self-initiated project with a clear purpose and a useful constraint.')}<div class="brief-grid">${courseData.portfolioBriefs.map(briefCard).join('')}</div>`; }
function renderResources() { return `${pageHeader('Useful by design', 'Resources', 'Slides, templates, references and practical tools collected for the course.')}<div class="resource-grid">${courseData.resources.map(resource => `<article class="resource-card"><div class="resource-icon">${escapeHTML(resource.icon)}</div><span class="tag">${escapeHTML(resource.category)}</span><h3>${escapeHTML(resource.title)}</h3><p>${escapeHTML(resource.description)}</p><a class="button" href="${escapeHTML(resource.url)}" ${resource.url.startsWith('http') ? 'target="_blank" rel="noreferrer"' : ''}>Open resource ↗</a></article>`).join('')}</div>`; }
function renderFeedback() { return `${pageHeader('Make progress together', 'Book feedback', 'Use a feedback slot to unblock a decision, review work in progress or talk through your final portfolio.')}<section class="feedback-card"><h2>Bring the question you cannot answer alone.</h2><p>Feedback works best when you bring a specific decision, an unfinished draft or a direction you want to test. Book a 20-minute slot and include a link to anything useful beforehand.</p><div class="booking-placeholder"><strong>Outlook Bookings</strong><br>Replace <code>bookingUrl</code> in <code>data.json</code> with your published Outlook Booking link to embed or launch your booking page.<br><br><a class="button" href="${escapeHTML(courseData.course.bookingUrl)}" target="_blank" rel="noreferrer">Open booking page ↗</a></div></section>${faq([{question:'What should I bring?',answer:'A link, a rough deck, a few images or simply a clear question. Work in progress is always welcome.'},{question:'I cannot find a slot.',answer:`Email ${courseData.course.feedbackEmail} with your availability and a short description of what you need.`}])}`; }

const renderers = { dashboard: renderDashboard, schedule: renderSchedule, 'group-project': renderGroupProject, 'final-portfolio': renderFinalPortfolio, 'brief-library': renderBriefLibrary, resources: renderResources, feedback: renderFeedback };
function navigate(route = location.hash.slice(1) || 'dashboard') {
  const validRoute = renderers[route] ? route : 'dashboard';
  $('#app').innerHTML = renderers[validRoute]();
  $('#page-label').textContent = document.querySelector(`[data-route="${validRoute}"]`)?.textContent || 'Dashboard';
  document.querySelectorAll('.primary-nav a').forEach(link => link.classList.toggle('active', link.dataset.route === validRoute));
  window.scrollTo({ top: 0, behavior: 'smooth' });
  $('#app').focus({ preventScroll: true });
}
function showModal(content) { document.body.insertAdjacentHTML('beforeend', `<div class="modal" role="dialog" aria-modal="true"><div class="modal-panel"><button class="modal-close" aria-label="Close">×</button>${content}</div></div>`); $('.modal-close').focus(); }
function openBrief(id) { const brief = courseData.portfolioBriefs.find(item => item.id === id); if (!brief) return; showModal(`<span class="tag">${escapeHTML(brief.category)} · ${escapeHTML(brief.difficulty)}</span><h2>${escapeHTML(brief.title)}</h2><p>${escapeHTML(brief.description)}</p><h3>Client</h3><p>${escapeHTML(brief.client)}</p><h3>Background</h3><p>${escapeHTML(brief.background)}</p><h3>Challenge</h3><p>${escapeHTML(brief.challenge)}</p><h3>Goals</h3><ul>${brief.goals.map(goal => `<li>${escapeHTML(goal)}</li>`).join('')}</ul><h3>Audience</h3><p>${escapeHTML(brief.audience)}</p><h3>Creative freedom</h3><p>${escapeHTML(brief.creativeFreedom)}</p><h3>Portfolio value</h3><p>${escapeHTML(brief.portfolioValue)}</p>`); }
function openScenario(id) { const scenario = courseData.groupProject.scenarios.find(item => item.id === id); if (!scenario) return; showModal(`<span class="tag">${escapeHTML(scenario.category)}</span><h2>${escapeHTML(scenario.title)}</h2><p>${escapeHTML(scenario.brief)}</p><h3>Skills developed</h3><ul>${scenario.skills.map(skill => `<li>${escapeHTML(skill)}</li>`).join('')}</ul><h3>Estimated workload</h3><p>${escapeHTML(scenario.workload)}</p>`); }
function openGuest(id) { const guest = courseData.guestLecturers.find(item => item.id === id); if (!guest) return; showModal(`<span class="tag">Guest lecture · ${escapeHTML(guest.date)}</span><h2>${escapeHTML(guest.name)}</h2><p><strong>${escapeHTML(guest.role)}, ${escapeHTML(guest.company)}</strong></p><p>${escapeHTML(guest.bio)}</p><h3>${escapeHTML(guest.lectureTitle)}</h3><p>${escapeHTML(guest.lectureDescription)}</p><h3>Learning outcomes</h3><ul>${guest.learningOutcomes.map(outcome => `<li>${escapeHTML(outcome)}</li>`).join('')}</ul><h3>Details</h3><p>${escapeHTML(guest.date)} · ${escapeHTML(guest.time)} · ${escapeHTML(guest.room)}</p><p><a href="${escapeHTML(guest.website)}" target="_blank" rel="noreferrer">Website</a> · <a href="${escapeHTML(guest.instagram)}" target="_blank" rel="noreferrer">Instagram</a> · <a href="${escapeHTML(guest.linkedin)}" target="_blank" rel="noreferrer">LinkedIn</a></p>`); }
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

loadCourseData().then(data => { courseData = data; navigate(); }).catch(error => { $('#app').innerHTML = `<div class="empty-state"><p>Course content could not load.</p><span>${escapeHTML(error.message)}</span></div>`; });
