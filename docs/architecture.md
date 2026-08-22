# Architecture

## Components

- **Host plugin (Cordis)**: registers the agent tools, the `/api/dsh-github/*` web routes used by the panel, and the `github` settings namespace consumed by the executor.
- **Client half**: the GitHub sidebar entry with account, repository, local Git, and settings tabs.
- **Store**: `~/.dsh/dsh-github.json`, written atomically with mode 0600. Accounts are summarized without returning token material.

## Token handling

- Clone/push authenticate by spawning git with an ephemeral `http.extraheader` environment configuration; the header exists only inside that child process environment.
- Tokens are never embedded in remote URLs, passed as command-line arguments, written to logs, or included in API responses.

## Safety gates

- Push is disabled until enabled in the settings panel; force push has an additional switch. Both gates are enforced on the Host side, so a compromised renderer cannot flip them alone.
- Pull is fast-forward only; the plugin never creates merge commits on its own.
