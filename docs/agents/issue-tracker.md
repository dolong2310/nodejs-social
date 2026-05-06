# Issue tracker: GitHub

Issues and PRDs for this repo live as GitHub issues on **`dolong2310/soosoo-social`** (remote `origin`). Use the `gh` CLI for all operations.

When `gh` must target this repo explicitly, pass `-R dolong2310/soosoo-social`.

## Conventions

- **Create an issue**: `gh issue create -R dolong2310/soosoo-social --title "..." --body "..."`. Use a heredoc for multi-line bodies.
- **Read an issue**: `gh issue view <number> -R dolong2310/soosoo-social --comments`, filtering comments by `jq` and also fetching labels.
- **List issues**: `gh issue list -R dolong2310/soosoo-social --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` with appropriate `--label` and `--state` filters.
- **Comment on an issue**: `gh issue comment <number> -R dolong2310/soosoo-social --body "..."`
- **Apply / remove labels**: `gh issue edit <number> -R dolong2310/soosoo-social --add-label "..."` / `--remove-label "..."`
- **Close**: `gh issue close <number> -R dolong2310/soosoo-social --comment "..."`

Inside this clone, `gh` often infers the repo from `git remote`; prefer `-R dolong2310/soosoo-social` when ambiguous (multiple remotes).

## When a skill says "publish to the issue tracker"

Create a GitHub issue on `dolong2310/soosoo-social`.

## When a skill says "fetch the relevant ticket"

Run `gh issue view <number> -R dolong2310/soosoo-social --comments`.
