# Content Creation & Portfolio — Course Hub

A calm, data-driven course handbook built with HTML, CSS and vanilla JavaScript. It works on Vercel and keeps course information out of the page markup.

## Run locally

Because the public app loads content files, serve the directory through a local web server rather than opening `index.html` directly:

```sh
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Content updates

The routinely updated course details and dashboard notices live in Markdown:

- [`content/course.md`](content/course.md) — title, term, introduction, email and booking link
- [`content/announcements.md`](content/announcements.md) — dashboard notices

Open either file in GitHub and press the pencil icon (**Edit this file**). Commit the change to `main`; Vercel deploys it automatically. See [`content/README.md`](content/README.md) for the exact editing format.

The structured schedule, guest profiles, briefs, project details and resources remain in [`data.json`](data.json). The app reads everything through one adapter function in [`app.js`](app.js), so the remaining sections can be migrated in the same way when they need frequent editing.

The hidden [`admin/`](admin/) area is a local-only legacy editor. It saves a preview copy in the teacher's browser and can export an updated `data.json` ready to commit.

### Important publishing note

Pure GitHub Pages is static: browser JavaScript cannot securely change repository files, and a folder such as `/admin` is not access-controlled by itself. This implementation intentionally does not pretend otherwise.

For private browser-based editing, connect the remaining `data.json` sections to a secure backend (for example Supabase or a GitHub App / OAuth service) and protect `/admin` through an identity provider. For normal course updates, edit the Markdown files in GitHub and commit to `main`.

## Deploy on Vercel

1. In Vercel, choose **Add New → Project** and import `stinafreijd/content-creation-and-portfolio`.
2. Leave the framework preset as **Other** and the build command empty.
3. Deploy. Vercel will serve the static files from the repository root.
4. In the Vercel project, confirm that **Production Branch** is `main`.

Every commit to `main` now creates a production deployment. Pull requests get a preview deployment.

## Structure

```text
index.html       Public single-page course hub
style.css        Public design system and responsive layout
app.js           Rendering, routing, search and content adapter
data.json        Structured content source (schedule, briefs, resources)
content/         Markdown files edited directly in GitHub
assets/images/   Local portraits and brief imagery
assets/icons/    Reserved for interface icons
admin/           Course editor (not linked publicly)
```
