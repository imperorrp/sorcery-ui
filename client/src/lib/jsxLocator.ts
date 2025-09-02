// Heuristic finder: locate the first `return (<JSX...>)` and return its inner range [start, end)
export interface JsxRange { start: number; end: number }

export function findReturnJsxRange(code: string): JsxRange | null {
  const returnIdx = code.indexOf('return');
  if (returnIdx === -1) return null;
  // find first '(' after return
  let i = returnIdx + 'return'.length;
  const n = code.length;
  while (i < n && /\s/.test(code[i])) i++;
  if (i >= n) return null;
  if (code[i] === '(') {
    const open = i;
    // scan to matching ')'
    let depth = 0;
    let j = open;
    let inStr: false | '"' | '\'' | '`' = false;
    for (; j < n; j++) {
      const ch = code[j];
      if (inStr) {
        if (ch === inStr && code[j - 1] !== '\\') inStr = false;
        continue;
      }
      if (ch === '"' || ch === '\'' || ch === '`') {
        inStr = ch as '"' | '\'' | '`';
        continue;
      }
      if (ch === '(') depth++;
      if (ch === ')') {
        depth--;
        if (depth === 0) {
          // Inner content excludes the outer parentheses
          return { start: open + 1, end: j };
        }
      }
    }
  }
  return null;
}
