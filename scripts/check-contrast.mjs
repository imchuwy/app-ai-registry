import { readFileSync, writeFileSync } from 'node:fs';
const css = readFileSync(new URL('../src/tokens.css', import.meta.url), 'utf8');
const luminance = hex => {
  const channels = hex.slice(1).match(/../g).map(x => parseInt(x, 16) / 255)
    .map(x => x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
};
const checks = [];
for (const theme of ['light', 'dark']) {
  const block = css.match(new RegExp("\\[data-theme='" + theme + "'\\] \\{([\\s\\S]*?)\\}"))[1];
  const tokens = Object.fromEntries([...block.matchAll(/--([\w-]+):\s*(#[\da-f]{6})/gi)].map(m => [m[1], m[2]]));
  const check = (fg, bg, target) => {
    const foreground=tokens[fg], background=tokens[bg];
    if (!foreground || !background) throw new Error(`Missing ${fg}/${bg}`);
    const a=luminance(foreground), b=luminance(background);
    const ratio=(Math.max(a,b)+0.05)/(Math.min(a,b)+0.05);
    checks.push({name:`${theme}: ${fg} on ${bg}`,foreground,background,ratio:Number(ratio.toFixed(4)),target,passes:ratio>=target});
  };
  for (const bg of ['canvas','surface','surface-raised']) {
    for (const fg of ['text','text-muted','link','success','warning','danger','info']) check(fg,bg,4.5);
    for (const fg of ['control-border','focus']) check(fg,bg,3);
  }
  for (const action of ['action','action-hover','action-pressed']) check('on-action',action,4.5);
  check('on-selected','selected',4.5);
  check('on-accent','accent',4.5);
}
const report={method:'WCAG sRGB relative luminance; opaque flat colours only. Does not cover opacity, imagery or whole-page accessibility.',checks};
const destination=new URL('../docs/contrast-checks.json',import.meta.url);
if(process.argv.includes('--write'))writeFileSync(destination,JSON.stringify(report,null,2)+'\n');
else if(JSON.stringify(JSON.parse(readFileSync(destination,'utf8')))!==JSON.stringify(report))throw new Error('Contrast report is stale; rerun with --write.');
const failures=checks.filter(c=>!c.passes);
console.log(`${checks.length-failures.length}/${checks.length} shared colour contrast checks passed.`);
if(failures.length){console.error(failures);process.exitCode=1;}
