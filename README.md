# Content Creation & Portfolio — Course Handbook

A Markdown-first course handbook for students. It is built as static HTML and deployed through Vercel whenever a change is committed to `main`.

## Update course content

Edit the Markdown files in [`content/`](content/README.md) directly in GitHub, then commit the change to `main`. Vercel automatically validates the content and deploys it. No local editor or JSON editing is needed.

Use `content/site.md` for the course overview, `content/schedule.md` for teaching sessions, `content/assignments/` for briefs and `content/resources.md` or `content/support.md` for links and practical information.

## Local preview

```sh
npm run build
python3 -m http.server 8000 --directory dist
```

Open `http://localhost:8000`. Run `npm run validate:content` to validate Markdown without generating the site.

## Vercel

Vercel runs `npm run build` and publishes `dist/`. If a Markdown file is malformed, the deployment fails and Vercel keeps the last successful version online.
