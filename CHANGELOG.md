# Changelog

## 0.1.2 - 2026-08-22

### Added

- GitHub Personal Access Token account management with secret-free summaries.
- Repository listing against github.com and GitHub Enterprise API URLs.
- Agent tools: auth list/test, repo list, clone, fast-forward pull, status, commit, push.
- Sidebar panel with account, repository, local Git, and settings tabs.

### Security

- Tokens are stored in ~/.dsh/dsh-github.json with an atomic write and mode 0600.
- Push is disabled by default and guarded on the Host side; force push needs an extra switch.
- Git HTTP authentication uses an ephemeral http.extraheader configuration; tokens never appear in clone URLs or process arguments.
