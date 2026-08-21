export const styles = String.raw`
[data-dsh-github-view] { display: none; height: 100%; min-height: 0; color: var(--dsw-alias-fg-l1, #e8e8e8); background: var(--dsw-alias-bg-l1, #151515); font: 13px/1.45 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
html[data-dsh-github-active] [data-dsh-github-view] { display: flex; flex-direction: column; }
html[data-dsh-github-active] [data-pane="conversation"] > *:not([data-dsh-github-view]) { display: none !important; }
.dshGithubEntry { display: flex; align-items: center; gap: 8px; width: calc(100% - 16px); margin: 4px 8px; padding: 8px 10px; border: 0; border-radius: 6px; color: inherit; background: transparent; cursor: pointer; text-align: left; }
.dshGithubEntry:hover, .dshGithubEntry[data-active="true"] { background: rgba(255,255,255,.09); }
.dshGithubEntryIcon { width: 18px; display: inline-flex; justify-content: center; color: #8ab4f8; }
.dshGithubEntryLabel { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dshGithubPanel { display: flex; flex-direction: column; min-height: 0; height: 100%; }
.dshGithubHeader { display: flex; align-items: center; gap: 14px; padding: 18px 24px 12px; border-bottom: 1px solid rgba(255,255,255,.1); }
.dshGithubTitle { margin: 0; font-size: 18px; font-weight: 650; }
.dshGithubSubtle { color: #9b9b9b; font-size: 12px; }
.dshGithubClose { margin-left: auto; border: 1px solid rgba(255,255,255,.16); border-radius: 5px; padding: 5px 10px; color: inherit; background: transparent; cursor: pointer; }
.dshGithubTabs { display: flex; gap: 2px; padding: 8px 24px 0; border-bottom: 1px solid rgba(255,255,255,.1); }
.dshGithubTab { border: 0; border-bottom: 2px solid transparent; padding: 8px 12px; color: #a9a9a9; background: transparent; cursor: pointer; }
.dshGithubTab[data-active="true"] { color: #fff; border-bottom-color: #8ab4f8; }
.dshGithubBody { min-height: 0; overflow: auto; padding: 18px 24px 28px; }
.dshGithubGrid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; max-width: 980px; }
.dshGithubSection { border: 1px solid rgba(255,255,255,.12); border-radius: 7px; padding: 16px; background: rgba(255,255,255,.025); }
.dshGithubSectionWide { grid-column: 1 / -1; }
.dshGithubSection h3 { margin: 0 0 12px; font-size: 14px; }
.dshGithubForm { display: grid; gap: 10px; }
.dshGithubField { display: grid; gap: 5px; }
.dshGithubField span { color: #b4b4b4; font-size: 12px; }
.dshGithubInput, .dshGithubSelect, .dshGithubTextarea { width: 100%; box-sizing: border-box; border: 1px solid rgba(255,255,255,.16); border-radius: 5px; padding: 8px 9px; color: inherit; background: rgba(0,0,0,.22); outline: none; }
.dshGithubInput:focus, .dshGithubSelect:focus, .dshGithubTextarea:focus { border-color: #8ab4f8; }
.dshGithubTextarea { min-height: 72px; resize: vertical; }
.dshGithubRow { display: flex; align-items: end; gap: 10px; flex-wrap: wrap; }
.dshGithubRow > .dshGithubField { flex: 1 1 190px; }
.dshGithubActions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-top: 6px; }
.dshGithubButton { border: 1px solid rgba(255,255,255,.18); border-radius: 5px; padding: 7px 11px; color: inherit; background: rgba(255,255,255,.06); cursor: pointer; }
.dshGithubButton:hover { background: rgba(255,255,255,.12); }
.dshGithubButton[data-primary="true"] { border-color: #668dcc; background: #315a98; }
.dshGithubButton[data-danger="true"] { color: #ffaaa8; }
.dshGithubButton:disabled { cursor: wait; opacity: .6; }
.dshGithubCheck { display: flex; align-items: center; gap: 8px; color: #c4c4c4; }
.dshGithubTable { width: 100%; border-collapse: collapse; }
.dshGithubTable th, .dshGithubTable td { padding: 9px 8px; border-bottom: 1px solid rgba(255,255,255,.09); text-align: left; vertical-align: top; }
.dshGithubTable th { color: #999; font-size: 11px; font-weight: 600; text-transform: uppercase; }
.dshGithubTable a { color: #8ab4f8; }
.dshGithubBadge { display: inline-block; border: 1px solid rgba(255,255,255,.16); border-radius: 999px; padding: 2px 7px; color: #bdbdbd; font-size: 11px; }
.dshGithubNotice { margin: 0 0 12px; border-left: 3px solid #e4ae57; padding: 8px 10px; color: #d8c49e; background: rgba(228,174,87,.08); }
.dshGithubNotice[data-kind="error"] { border-left-color: #e47777; color: #f0b2b2; background: rgba(228,119,119,.08); }
.dshGithubOutput { margin: 12px 0 0; max-height: 240px; overflow: auto; border: 1px solid rgba(255,255,255,.1); border-radius: 5px; padding: 10px; color: #cfcfcf; background: #0d0d0d; white-space: pre-wrap; font: 12px/1.45 ui-monospace, SFMono-Regular, Consolas, monospace; }
@media (max-width: 760px) { .dshGithubGrid { grid-template-columns: 1fr; } .dshGithubSectionWide { grid-column: auto; } .dshGithubHeader, .dshGithubTabs, .dshGithubBody { padding-left: 14px; padding-right: 14px; } .dshGithubTable { min-width: 650px; } }
`
export function installStyles(): void { if (document.querySelector('style[data-dsh-github-css]') !== null) return; const tag = document.createElement('style'); tag.dataset.dshGithubCss = 'true'; tag.textContent = styles; document.head.appendChild(tag) }
