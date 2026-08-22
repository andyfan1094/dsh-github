# Security notes

- Tokens are stored in `~/.dsh/dsh-github.json` (mode 0600, atomic write). The file is local configuration, not a system secret vault.
- Tokens are never written to clone URLs, process arguments, logs, package metadata, or documentation.
- Git HTTP authentication uses an ephemeral `http.extraheader` environment configuration scoped to the spawned git process.
- Push and force push are disabled by default; enabling them requires explicit switches in the settings panel and force push has an additional guard.
- Use a fine-grained personal access token limited to the repositories and permissions DSH actually needs.

If a token is pasted into chat, screenshots, or source control, revoke it immediately and add a replacement through the panel.
