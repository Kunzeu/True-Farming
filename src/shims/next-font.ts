/** Shim for next/font/google — use CSS class only. */
export function Inter(_opts?: unknown) {
  return { className: 'font-sans', style: { fontFamily: 'system-ui, Arial, sans-serif' } };
}

export function Roboto(_opts?: unknown) {
  return { className: 'font-sans', style: { fontFamily: 'system-ui, Arial, sans-serif' } };
}

const fonts = { Inter, Roboto };
export default fonts;
