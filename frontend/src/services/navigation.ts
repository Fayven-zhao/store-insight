/** Minimal page navigation — no reload, uses CustomEvent */
type PageListener = (page: 'dashboard' | 'data' | 'alerts', extra?: Record<string, string>) => void;
let _listener: PageListener | null = null;

export function onNavigate(fn: PageListener) { _listener = fn; }

export function navigateTo(page: 'dashboard' | 'data', extra?: Record<string, string>) {
  if (extra) {
    Object.entries(extra).forEach(([k, v]) => sessionStorage.setItem(k, v));
  }
  _listener?.(page, extra);
}
