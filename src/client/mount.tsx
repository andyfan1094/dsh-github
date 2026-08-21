import { createRoot, type Root } from 'react-dom/client'
import type { GithubApi } from './api.ts'
import type { PanelController } from './controller.ts'
import { GithubPanel } from './panel/GithubPanel.tsx'
export function mountPanel(controller: PanelController, api: GithubApi): () => void {
  let root: Root | undefined; let container: HTMLDivElement | undefined
  const ensure = (): void => { if (container?.isConnected) return; const column = document.querySelector<HTMLElement>('[data-pane="conversation"], [class*="centerCol"]'); if (!column) return; container = document.createElement('div'); container.dataset.dshGithubView = ''; column.appendChild(container); root = createRoot(container); root.render(<GithubPanel api={api} controller={controller} />) }
  const sync = (): void => { ensure(); if (controller.getSnapshot().open) document.documentElement.setAttribute('data-dsh-github-active', ''); else document.documentElement.removeAttribute('data-dsh-github-active') }
  const observer = new MutationObserver(() => { ensure() }); observer.observe(document.body, { childList: true, subtree: true })
  const SIDEBAR_CONTEXT_SELECTOR = '[class*="sessionRow"], [class*="projectRow"], [class*="searchResultRow"], [class*="searchResultWorkspace"], [class*="newSession"]'
  function onSidebarContextClick(event: MouseEvent): void { if (!controller.getSnapshot().open) return; const target = event.target; if (target instanceof Element && target.closest(SIDEBAR_CONTEXT_SELECTOR) !== null) controller.close() }
  document.addEventListener('click', onSidebarContextClick, true)
  // Mutex: when feishu panel activates, close self so both panels never show at once
  function onOtherActive(): void { if (controller.getSnapshot().open) controller.close() }
  const otherObserver = new MutationObserver(() => { if (document.documentElement.hasAttribute('data-dsh-feishu-active')) onOtherActive() })
  otherObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-dsh-feishu-active'] })
  const unsubscribe = controller.subscribe(sync); sync()
  return () => { observer.disconnect(); unsubscribe(); document.removeEventListener('click', onSidebarContextClick, true); otherObserver.disconnect(); document.documentElement.removeAttribute('data-dsh-github-active'); root?.unmount(); container?.remove(); root = undefined; container = undefined }
}
