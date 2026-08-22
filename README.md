# dsh-github

DSH Web UI 的 GitHub 与本地 Git 工作流插件。

## Features

- GitHub Personal Access Token account management with secret-free summaries.
- GitHub REST repository listing for github.com and GitHub Enterprise API URLs.
- Local Git operations: clone, fast-forward pull, status, commit, push, and force-with-lease.
- Sidebar panel with account, repository, local Git, and settings tabs.
- Push and force push are disabled by default and are guarded on the Host side.
- Token storage uses ~/.dsh/dsh-github.json with an atomic write and mode 0600.
- Git HTTP authentication uses an ephemeral http.extraheader environment configuration; tokens are not placed in clone URLs or process arguments.

## Install in a profile

    pnpm install
    pnpm run build
    dsh plugin --profile web add link:D:\项目\dsh-github

Restart the existing DSH Web process after installation. Open the GitHub sidebar entry and add a replacement token there. The plugin deliberately does not ship a token in source, package metadata, logs, or documentation.

## Agent tools

- github_auth_list, github_auth_test
- github_repo_list
- github_clone, github_pull, github_status
- github_commit, github_push

## Compatibility

- DSH Host `0.1.0-rc.8` or newer compatible release.
- Node.js `22.19.0` or newer.
- Git must be available through the configured executable.

## Security

The account file is local configuration, not a system secret vault. Use a fine-grained GitHub token with only the repositories and permissions needed by DSH. Revoke any token pasted into chat or source control and create a new one through the panel.
