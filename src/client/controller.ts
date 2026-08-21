export interface PanelSnapshot { open: boolean }
export class PanelController {
  private openState = false
  private listeners = new Set<() => void>()
  getSnapshot(): PanelSnapshot { return { open: this.openState } }
  subscribe(listener: () => void): () => void { this.listeners.add(listener); return () => { this.listeners.delete(listener) } }
  toggle(): void { this.openState = !this.openState; this.notify() }
  close(): void { if (!this.openState) return; this.openState = false; this.notify() }
  private notify(): void { for (const listener of [...this.listeners]) listener() }
}
