export function engageWarp() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('stella:warp'));
  }
}