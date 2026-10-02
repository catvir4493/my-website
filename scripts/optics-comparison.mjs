import { readFileSync, writeFileSync } from "node:fs";
const output = process.argv[2] || "artifacts/v1.5";
const captures = [
  ["首页 / Compute Core 构图", "home"],
  ["Compute Core 局部", "core"],
  ["Vision Navigation / 传感器玻璃", "projects-vision-navigation"],
  ["AirPocket / 轻透路线层", "projects-airpocket"],
  ["Swordsmith Notebook / 定向暖光", "projects-swordsmith-notebook"],
  ["Gomoku AI / 棋子顶光", "projects-gomoku-ai"],
  ["项目卡片 / 表面与反射", "projects"],
];
const sections = captures
  .map(([label, name], index) => {
    const before = readFileSync(`${output}/before/${name}.png`);
    const after = readFileSync(`${output}/after/${name}.png`);
    const width = before.readUInt32BE(16),
      height = before.readUInt32BE(20);
    if (width !== after.readUInt32BE(16) || height !== after.readUInt32BE(20))
      throw Error(`Mismatched capture dimensions: ${name}`);
    return `<section><h2>${label}</h2><div class="comparison" style="--split:50%;aspect-ratio:${width}/${height}"><img src="before/${name}.png" alt="${label} v1.4 截图" draggable="false"><img class="after" src="after/${name}.png" alt="${label} v1.5 截图" draggable="false"><div class="divider"><span>↔</span></div><span class="tag before-tag">v1.4 · 升级前</span><span class="tag after-tag">v1.5 · 升级后</span></div><label for="compare-${index}">拖动图片或滑块查看变化；滑块支持键盘方向键</label><input id="compare-${index}" type="range" min="0" max="100" value="50" aria-label="${label} 前后对照位置"></section>`;
  })
  .join("\n");
writeFileSync(
  `${output}/comparison.html`,
  `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Marcell.OS v1.4 → v1.5 光学对照</title><style>
*{box-sizing:border-box}body{margin:0;background:#080d11;color:#e4edf3;font:16px/1.7 system-ui,sans-serif;padding:30px;max-width:1440px;margin:auto}h1{font-size:clamp(24px,4vw,36px);line-height:1.2}p,label{color:#9eafbb}section{margin:48px 0}h2{font-size:19px}.comparison{position:relative;border:1px solid #33414d;overflow:hidden;cursor:ew-resize;touch-action:pan-y}.comparison img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;pointer-events:none}.after{clip-path:inset(0 0 0 var(--split))}.divider{position:absolute;inset:0 auto 0 var(--split);border-left:1px solid #c8dde5a0;pointer-events:none}.divider span{position:absolute;top:50%;left:0;transform:translate(-50%,-50%);background:#10212e;border:1px solid #698797;border-radius:50%;width:34px;height:34px;text-align:center;line-height:30px;color:#d2e2e9}.tag{position:absolute;bottom:12px;background:#080d11e8;padding:4px 12px;font-size:12px;pointer-events:none}.before-tag{left:12px}.after-tag{right:12px}label{display:block;margin-top:10px;font-size:13px}input{width:100%;accent-color:#8dcbd9}input:focus-visible{outline:2px solid #acd5e5;outline-offset:6px}@media(max-width:600px){body{padding:16px}.tag{font-size:10px;padding:3px 7px}}
</style></head><body><h1>MARCELL.OS v1.4 → v1.5</h1><p>OPTICS &amp; PERCEPTUAL LIGHTING PASS</p><p>实际浏览器截图。完整页面均为 1440×900；Core 局部来自相同视口。保持同一默认观察方向、相同布局和完整示意图状态；v1.5 镜头由 45° 改为 40°，投影尺寸匹配。时钟、细微轨道相位及实时 GitHub 数据可能不同。</p>${sections}<script>
for (const section of document.querySelectorAll('section')) {
  const stage=section.querySelector('.comparison'),range=section.querySelector('input');
  const set=(value)=>{const n=Math.max(0,Math.min(100,value));stage.style.setProperty('--split',n+'%');range.value=String(n);};
  range.addEventListener('input',()=>set(Number(range.value)));
  const move=(event)=>{const bounds=stage.getBoundingClientRect();set((event.clientX-bounds.left)/bounds.width*100);};
  stage.addEventListener('pointerdown',(event)=>{stage.setPointerCapture(event.pointerId);move(event);});
  stage.addEventListener('pointermove',(event)=>{if(stage.hasPointerCapture(event.pointerId))move(event);});
  stage.addEventListener('pointerup',(event)=>{if(stage.hasPointerCapture(event.pointerId))stage.releasePointerCapture(event.pointerId);});
}
</script></body></html>`,
  "utf8",
);
console.log(`Saved ${captures.length} draggable comparisons to ${output}/comparison.html`);
