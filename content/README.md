# Editing the course handbook

Every visible text on the site comes from a normal Markdown file in this folder. In GitHub, open a file, choose the pencil icon, make your change and commit it to `main`. Vercel publishes the change automatically.

## Which file should I edit?

| To change… | Edit… |
| --- | --- |
| Course introduction and “Start here” | `site.md` |
| Teaching sessions, rooms and deadlines | `schedule.md` |
| Group project or final portfolio instructions | `assignments/group-project.md` or `assignments/final-portfolio.md` |
| A portfolio brief | the matching file in `assignments/briefs/` |
| Course links and reference material | `resources.md` |
| Feedback, Canvas and contact information | `support.md` |

## Keep the small block at the top

Files begin with a small frontmatter block between `---` lines. Keep its field names unchanged; it controls page titles and card summaries. The writing below the second `---` is ordinary Markdown.

## Update the schedule

Each week begins with this pattern:

```md
## Week 36 — Introduction & branding
31 Aug–4 Sep

| Date | Time | Activity | Type | Location |
| --- | --- | --- | --- | --- |
| 31 Aug | 15:15–17:00 | Introduction | Lecture | E1029 |
```

Copy a complete row to add a session. Keep all five columns; use `Deadline` in the Type column for hand-ins.

## Before committing

Preview the Markdown in GitHub and make sure every link points to the correct place. If Vercel reports a failed deployment, open its build log: it names the file and missing field or malformed schedule row to fix.
