# Edit course content

The two files in this folder are designed to be changed directly in GitHub.
Open a file, press the pencil icon (**Edit this file**), make the change and
choose **Commit changes**. Vercel publishes the update automatically once the
repository is connected.

## Regular updates

- [Course title, term, introduction, email and booking link](course.md)
- [Dashboard announcements](announcements.md)

## Announcements

Each announcement has a heading, a date and an optional pinned state:

```md
## Title visible on the dashboard
Date: 31 aug 2026 | Pinned: yes

Write the announcement here.
```

Put the newest announcement first. Only use `Pinned: yes` when it should be
marked as important.

## Course settings

The values between the `---` lines in `course.md` control the course details.
Leave the names before the colon unchanged, for example:

```md
term: Autumn term 2026
bookingUrl: https://example.com/booking
```

The schedule, briefs and resources still use `data.json`; they can be moved to
the same Markdown pattern in a later pass if their content needs frequent edits.
