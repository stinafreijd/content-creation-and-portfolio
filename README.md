# Content Creation & Portfolio — Course Hub

A calm, data-driven course handbook built with HTML, CSS and vanilla JavaScript. It is designed for GitHub Pages and keeps course information out of the page markup.

## Run locally

Because the public app loads `data.json`, serve the directory through a local web server rather than opening `index.html` directly:

```sh
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Content updates

All public content is stored in [`data.json`](data.json). The app reads it through one adapter function in [`app.js`](app.js), making a later move to Google Sheets, Supabase, Firebase or a CMS straightforward.

The hidden [`admin/`](admin/) area provides forms for weeks, guest lecturers, portfolio briefs, group scenarios, resources, announcements and course settings. It saves a preview copy in the teacher's browser and can export an updated `data.json` ready to commit.

### Important publishing note

Pure GitHub Pages is static: browser JavaScript cannot securely change repository files, and a folder such as `/admin` is not access-controlled by itself. This implementation intentionally does not pretend otherwise.

For real private editing and one-click publishing, connect the existing data adapter to a secure backend (for example Supabase or a GitHub App / OAuth service) and protect `/admin` through an identity provider. Until then, export `data.json`, replace the repository file, and push to `main` to publish for all students.

## Deploy on GitHub Pages

1. Commit and push this repository.
2. In GitHub, open **Settings → Pages**.
3. Select **Deploy from a branch**, then choose `main` and `/ (root)`.
4. Save. GitHub will publish the site at the Pages URL shown there.

## Structure

```text
index.html       Public single-page course hub
style.css        Public design system and responsive layout
app.js           Rendering, routing, search and content adapter
data.json        Course content source
assets/images/   Local portraits and brief imagery
assets/icons/    Reserved for interface icons
admin/           Course editor (not linked publicly)
```
