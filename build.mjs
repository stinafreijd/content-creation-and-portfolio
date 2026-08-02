import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const contentDir = join(root, 'content');
const outputDir = join(root, 'dist');
const checkOnly = process.argv.includes('--check');

function fail(message) { throw new Error(`Content validation failed: ${message}`); }
function read(path) { return readFileSync(path, 'utf8').replace(/\r\n/g, '\n'); }
function escapeHtml(value = '') { return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character])); }
function slug(value) { return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); }

function frontmatter(source, file) {
  const match = source.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) fail(`${relative(root, file)} needs a frontmatter block.`);
  const data = {};
  match[1].split('\n').filter(Boolean).forEach(line => {
    const separator = line.indexOf(':');
    if (separator < 1) fail(`${relative(root, file)} has invalid frontmatter: “${line}”.`);
    data[line.slice(0, separator).trim()] = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '');
  });
  return { data, body: match[2].trim() };
}

function inline(text) {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, url) => `<a href="${url}"${url.startsWith('http') ? ' target="_blank" rel="noreferrer"' : ''}>${label}</a>`);
}

function markdown(source) {
  const lines = source.split('\n');
  const output = [];
  let paragraph = [];
  let list = [];
  let table = [];
  const flushParagraph = () => { if (paragraph.length) output.push(`<p>${inline(paragraph.join(' '))}</p>`); paragraph = []; };
  const flushList = () => { if (list.length) output.push(`<ul>${list.map(item => `<li>${inline(item)}</li>`).join('')}</ul>`); list = []; };
  const flushTable = () => {
    if (!table.length) return;
    const rows = table.map(row => row.split('|').slice(1, -1).map(cell => cell.trim()));
    if (rows.length < 3 || !rows[1].every(cell => /^:?-{3,}:?$/.test(cell))) fail('A Markdown table needs a header and separator row.');
    output.push(`<div class="table-wrap"><table><thead><tr>${rows[0].map(cell => `<th>${inline(cell)}</th>`).join('')}</tr></thead><tbody>${rows.slice(2).map(row => `<tr>${row.map(cell => `<td>${inline(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
    table = [];
  };
  for (const line of lines) {
    if (/^\|.*\|\s*$/.test(line)) { flushParagraph(); flushList(); table.push(line); continue; }
    flushTable();
    if (!line.trim()) { flushParagraph(); flushList(); continue; }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) { flushParagraph(); flushList(); const level = heading[1].length; const id = level === 2 ? ` id="${slug(heading[2])}"` : ''; output.push(`<h${level}${id}>${inline(heading[2])}</h${level}>`); continue; }
    const item = line.match(/^[-*]\s+(.+)$/);
    if (item) { flushParagraph(); list.push(item[1]); continue; }
    if (/^---+$/.test(line)) { flushParagraph(); flushList(); output.push('<hr>'); continue; }
    paragraph.push(line.trim());
  }
  flushParagraph(); flushList(); flushTable();
  return output.join('\n');
}

function parseSchedule(file) {
  const { data, body } = frontmatter(read(file), file);
  if (!data.year || !/^\d{4}$/.test(data.year)) fail('content/schedule.md needs a four-digit year.');
  const weeks = [];
  const blocks = body.split(/(?=^##\s+)/m).filter(Boolean);
  for (const block of blocks) {
    const [heading, ...rest] = block.trim().split('\n');
    const match = heading.match(/^##\s+Week\s+(\d+)\s*[—–-]\s*(.+)$/i);
    if (!match) fail(`Schedule heading must be “## Week 36 — Topic”: ${heading}`);
    const lines = rest.join('\n').split('\n').filter(Boolean);
    const range = lines.shift();
    const tableLines = lines.filter(line => /^\|.*\|\s*$/.test(line));
    if (tableLines.length < 3) fail(`Week ${match[1]} needs a schedule table.`);
    const rows = tableLines.map(row => row.split('|').slice(1, -1).map(cell => cell.trim()));
    const events = rows.slice(2).map((row, index) => {
      if (row.length !== 5 || row.some(cell => !cell)) fail(`Week ${match[1]}, row ${index + 1} needs Date, Time, Activity, Type and Location.`);
      return { date: row[0], time: row[1], title: row[2], type: row[3], location: row[4] };
    });
    weeks.push({ number: Number(match[1]), title: match[2], range, events });
  }
  if (!weeks.length) fail('content/schedule.md needs at least one week.');
  return { ...data, weeks };
}

function pageTitle(page, site) { return page === site.title ? `${page} — Course handbook` : `${page} — ${site.title}`; }
function navLink(href, name, icon, selected) { return `<a href="${href}" ${selected ? 'aria-current="page"' : ''}><i data-lucide="${icon}"></i><span>${name}</span></a>`; }
function nav(current) { return `<nav aria-label="Primary navigation">${navLink('/', 'Start', 'home', current === 'start')}${navLink('/schedule/', 'Schedule', 'calendar-days', current === 'schedule')}${navLink('/assignments/', 'Assignments', 'clipboard-list', current === 'assignments')}${navLink('/resources/', 'Resources', 'library', current === 'resources')}${navLink('/support/', 'Support', 'circle-help', current === 'support')}</nav>`; }
function layout({ site, title, current, body }) { return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description" content="${escapeHtml(site.description)}"><title>${escapeHtml(pageTitle(title, site))}</title><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"><link rel="stylesheet" href="/style.css"></head><body><header class="site-header"><div class="nav-bar"><a class="brand" href="/"><span>CC</span>${escapeHtml(site.title)}</a>${nav(current)}</div></header><main>${body}</main><footer><div><p>${escapeHtml(site.term)} · Course handbook</p><p>Course updates and submissions are published in Canvas.</p></div><a href="/support/" class="footer-link">Get support <i data-lucide="arrow-up-right"></i></a></footer><script src="https://unpkg.com/lucide@0.468.0/dist/umd/lucide.min.js"></script><script src="/site.js"></script></body></html>`; }
function writePage(path, html) { const target = join(outputDir, path); mkdirSync(target, { recursive: true }); writeFileSync(join(target, 'index.html'), html); }
function card(href, eyebrow, title, text, icon = 'arrow-up-right') { return `<a class="card" href="${href}"><div class="card-topline"><p class="eyebrow">${escapeHtml(eyebrow)}</p><i data-lucide="${icon}"></i></div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(text)}</p><span>Open <i data-lucide="arrow-right"></i></span></a>`; }

const siteFile = join(contentDir, 'site.md');
const { data: site, body: homeBody } = frontmatter(read(siteFile), siteFile);
['title', 'term', 'description'].forEach(key => { if (!site[key]) fail(`content/site.md needs “${key}”.`); });
const schedule = parseSchedule(join(contentDir, 'schedule.md'));
const assignmentDir = join(contentDir, 'assignments');
const assignmentFiles = ['group-project.md', 'final-portfolio.md'];
const assignments = assignmentFiles.map(name => { const file = join(assignmentDir, name); const parsed = frontmatter(read(file), file); ['title', 'summary'].forEach(key => { if (!parsed.data[key]) fail(`${relative(root, file)} needs “${key}”.`); }); return { ...parsed, slug: name.replace(/\.md$/, '') }; });
const briefDir = join(assignmentDir, 'briefs');
const briefs = readdirSync(briefDir).filter(name => name.endsWith('.md')).sort().map(name => { const file = join(briefDir, name); const parsed = frontmatter(read(file), file); ['title', 'category', 'summary'].forEach(key => { if (!parsed.data[key]) fail(`${relative(root, file)} needs “${key}”.`); }); return { ...parsed, slug: name.replace(/\.md$/, '') }; });
if (briefs.length < 1) fail('Add at least one file in content/assignments/briefs/.');
const resourcesFile = join(contentDir, 'resources.md');
const supportFile = join(contentDir, 'support.md');
const resources = frontmatter(read(resourcesFile), resourcesFile);
const support = frontmatter(read(supportFile), supportFile);
const allEvents = schedule.weeks.flatMap(week => week.events.map(event => ({ ...event, week })));
const monthIndex = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
const eventDate = event => { const [day, month] = event.date.split(' '); return new Date(Number(schedule.year), monthIndex[month], Number(day)); };
const today = new Date(); today.setHours(0, 0, 0, 0);
const nextEvent = allEvents.find(event => eventDate(event) >= today) || allEvents[0];
const nextDeadline = allEvents.find(event => event.type.toLowerCase() === 'deadline' && eventDate(event) >= today) || allEvents.find(event => event.type.toLowerCase() === 'deadline');

if (!checkOnly) {
  rmSync(outputDir, { recursive: true, force: true });
  mkdirSync(outputDir, { recursive: true });
  cpSync(join(root, 'assets'), join(outputDir, 'assets'), { recursive: true });
  cpSync(join(root, 'public'), outputDir, { recursive: true });
  const startCards = `${card('/schedule/', 'Plan your week', 'Schedule', 'Find teaching sessions, labs, rooms and deadlines.', 'calendar-days')}${card('/assignments/', 'Make the work', 'Assignments', 'Understand the group project, final portfolio and creative briefs.', 'clipboard-list')}${card('/resources/', 'Keep learning', 'Resources', 'Open course guides, slides, templates and useful references.', 'library')}${card('/support/', 'Get help', 'Support', 'Find feedback booking, contact details and Canvas.', 'circle-help')}`;
  const dashboard = `<section class="dashboard" aria-label="Course overview"><div class="dashboard-feature"><p class="eyebrow"><i data-lucide="calendar-clock"></i> Next up · Week ${nextEvent.week.number}</p><h2>${escapeHtml(nextEvent.title)}</h2><dl><div><dt>Date</dt><dd>${escapeHtml(nextEvent.date)}</dd></div><div><dt>Time</dt><dd>${escapeHtml(nextEvent.time)}</dd></div><div><dt>Location</dt><dd>${escapeHtml(nextEvent.location)}</dd></div></dl><a class="button button-secondary" href="/schedule/">Open schedule <i data-lucide="arrow-right"></i></a></div><div class="dashboard-stack"><article class="dashboard-item"><p class="eyebrow"><i data-lucide="flag"></i> Next assignment</p><h3>${escapeHtml(nextDeadline?.title || 'No upcoming deadline')}</h3><p>${nextDeadline ? `${escapeHtml(nextDeadline.date)} · ${escapeHtml(nextDeadline.time)} · ${escapeHtml(nextDeadline.location)}` : 'Check the assignment pages for submission details.'}</p><a href="/assignments/">View assignments <i data-lucide="arrow-up-right"></i></a></article><article class="dashboard-item"><p class="eyebrow"><i data-lucide="megaphone"></i> Course updates</p><h3>Check Canvas</h3><p>Canvas is the source for official announcements, submissions and grades.</p><a href="/support/">Find support <i data-lucide="arrow-up-right"></i></a></article></div></section>`;
  writePage('', layout({ site, title: site.title, current: 'start', body: `<section class="hero"><p class="eyebrow">${escapeHtml(site.term)} · Course handbook</p><h1>${escapeHtml(site.title)}</h1><p>${escapeHtml(site.description)}</p><div class="hero-actions"><a class="button" href="/schedule/">View schedule <i data-lucide="arrow-right"></i></a><a class="button button-ghost" href="/assignments/">Explore assignments</a></div></section><section class="prose intro">${markdown(homeBody)}</section>${dashboard}<section class="section-heading"><div><p class="eyebrow">Course essentials</p><h2>Find what you need</h2></div></section><section class="card-grid">${startCards}</section>` }));
  const scheduleCards = schedule.weeks.map(week => `<section class="week"><header><p class="eyebrow">Week ${week.number}</p><h2>${escapeHtml(week.title)}</h2><p>${escapeHtml(week.range)}</p></header><div class="table-wrap"><table><thead><tr><th>Date</th><th>Time</th><th>Activity</th><th>Type</th><th>Location</th></tr></thead><tbody>${week.events.map(event => `<tr><td>${escapeHtml(event.date)}</td><td>${escapeHtml(event.time)}</td><td>${escapeHtml(event.title)}</td><td><span class="tag">${escapeHtml(event.type)}</span></td><td>${escapeHtml(event.location)}</td></tr>`).join('')}</tbody></table></div></section>`).join('');
  writePage('schedule', layout({ site, title: 'Schedule', current: 'schedule', body: `<header class="page-heading"><p class="eyebrow">Plan your week</p><h1>Course schedule</h1><p>Teaching sessions, labs and deadlines. Check Canvas for short-notice changes.</p></header><div class="schedule">${scheduleCards}</div>` }));
  const assignmentCards = assignments.map(item => card(`/assignments/${item.slug}/`, 'Assignment', item.data.title, item.data.summary)).join('') + card('/assignments/briefs/', 'Choose two', 'Creative brief library', `${briefs.length} fictional briefs to develop into portfolio work.`);
  writePage('assignments', layout({ site, title: 'Assignments', current: 'assignments', body: `<header class="page-heading"><p class="eyebrow">Make the work</p><h1>Assignments</h1><p>Read the brief, understand what to submit, then use Canvas for the hand-in.</p></header><section class="card-grid">${assignmentCards}</section>` }));
  assignments.forEach(item => writePage(`assignments/${item.slug}`, layout({ site, title: item.data.title, current: 'assignments', body: `<a class="back" href="/assignments/">← All assignments</a><article class="prose document"><p class="eyebrow">Assignment</p>${markdown(`# ${item.data.title}\n\n${item.body}`)}</article>` })));
  const briefCards = briefs.map(item => card(`/assignments/briefs/${item.slug}/`, item.data.category, item.data.title, item.data.summary)).join('');
  writePage('assignments/briefs', layout({ site, title: 'Creative brief library', current: 'assignments', body: `<a class="back" href="/assignments/">← All assignments</a><header class="page-heading"><p class="eyebrow">Choose two</p><h1>Creative brief library</h1><p>Select two briefs that help you make the kind of work you want in your portfolio.</p></header><section class="card-grid">${briefCards}</section>` }));
  briefs.forEach(item => writePage(`assignments/briefs/${item.slug}`, layout({ site, title: item.data.title, current: 'assignments', body: `<a class="back" href="/assignments/briefs/">← Creative brief library</a><article class="prose document"><p class="eyebrow">${escapeHtml(item.data.category)}</p>${markdown(`# ${item.data.title}\n\n${item.body}`)}</article>` })));
  writePage('resources', layout({ site, title: 'Resources', current: 'resources', body: `<header class="page-heading"><p class="eyebrow">Keep learning</p><h1>Resources</h1><p>Course material, templates and references collected in one place.</p></header><article class="prose document">${markdown(resources.body)}</article>` }));
  writePage('support', layout({ site, title: 'Support', current: 'support', body: `<header class="page-heading"><p class="eyebrow">Get help</p><h1>Support</h1><p>Use these routes when you need course guidance or practical help.</p></header><article class="prose document">${markdown(support.body)}</article>` }));
}

console.log(`Validated ${assignments.length} assignments, ${briefs.length} briefs and ${schedule.weeks.length} schedule weeks.`);
