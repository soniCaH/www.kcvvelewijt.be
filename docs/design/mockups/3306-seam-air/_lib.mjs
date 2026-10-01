// Shared page-side helpers for #3306 (run inside page.evaluate).
export const pageFns = String.raw`
window.__ink = (el, side) => {
  // visible-content edge of el: text runs + replaced elements, ignoring empty boxes
  let best = side === "bottom" ? -Infinity : Infinity;
  const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  for (let n = w.currentNode; n; n = w.nextNode()) {
    let rects = [];
    if (n.nodeType === 3) { if (!n.textContent.trim()) continue; const r = document.createRange(); r.selectNodeContents(n); rects = [...r.getClientRects()]; }
    else if (/^(IMG|SVG|PICTURE|VIDEO|IFRAME|INPUT|BUTTON)$/i.test(n.tagName) || n.tagName === "svg") rects = [n.getBoundingClientRect()];
    else { const cs = getComputedStyle(n); if (cs.backgroundImage !== "none" || (cs.borderTopWidth !== "0px" && cs.borderTopStyle !== "none")) rects = [n.getBoundingClientRect()]; }
    for (const r of rects) { if (!r.width || !r.height) continue; if (getComputedStyle(n.nodeType === 3 ? n.parentElement : n).visibility === "hidden") continue;
      best = side === "bottom" ? Math.max(best, r.bottom) : Math.min(best, r.top); }
  }
  return best + scrollY;
};
window.__padded = (el, side) => {
  // first descendant along the edge that owns padding on that side
  const k = side === "bottom" ? "paddingBottom" : "paddingTop";
  for (let e = el; e; e = side === "bottom" ? e.lastElementChild : e.firstElementChild) if (parseFloat(getComputedStyle(e)[k]) > 0) return e;
  return null;
};
window.__seams = () => [...document.querySelectorAll("main svg[data-height][data-direction=horizontal]")].map((s) => {
  const prev = s.previousElementSibling, next = s.nextElementSibling;
  return { s, prev, next };
}).filter((x) => x.prev && x.next);
`;
