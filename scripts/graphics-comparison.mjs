import { readFileSync, writeFileSync } from "node:fs";
const output = process.argv[2] || "artifacts/v1.5.1";
const pairs = [
  [
    "840px 高 DPI 笔记本：升级前 / 升级后",
    "before/840x849-dpr1.75.png",
    "840x849-dpr1.75-auto.png",
    "v1.5.0",
    "v1.5.1 AUTO",
  ],
  [
    "1919px 宽窗口：升级前 / 升级后",
    "before/1919x1568-dpr1.png",
    "1919x1568-dpr1-auto.png",
    "v1.5.0",
    "v1.5.1 AUTO",
  ],
  [
    "1440px 桌面：升级前 / 升级后",
    "before/1440x900-dpr1.25.png",
    "1440x900-dpr1.25-auto.png",
    "v1.5.0",
    "v1.5.1 AUTO",
  ],
  [
    "Compact Desktop：HIGH / MEDIUM",
    "840x849-dpr1.75-high.png",
    "840x849-dpr1.75-medium.png",
    "HIGH · DPR ≤1.5",
    "MEDIUM · DPR ≤1.25",
  ],
  ["Desktop：HIGH / MEDIUM", "desktop-high.png", "desktop-medium.png", "HIGH", "MEDIUM"],
  [
    "同一能力条件：Case A / Case B Core",
    "840x849-dpr1.75-auto-core.png",
    "1919x1568-dpr1-auto-core.png",
    "840×849 @1.75 · HIGH",
    "1919×1568 @1 · HIGH",
  ],
  [
    "紧凑构图：完整动画 / Reduced Motion 静态材质",
    "840x849-dpr1.75-auto.png",
    "compact-reduced-motion.png",
    "动画 · HIGH",
    "静止 · HIGH",
  ],
];
const sections = pairs
  .map(([title, left, right, l, r], index) => {
    const png = readFileSync(`${output}/${left}`),
      width = png.readUInt32BE(16),
      height = png.readUInt32BE(20);
    readFileSync(`${output}/${right}`);
    return `<section><h2>${title}</h2><div class="comparison" style="--split:50%;aspect-ratio:${width}/${height}"><img src="${left}" alt="${title} ${l}" draggable="false"><img class="after" src="${right}" alt="${title} ${r}" draggable="false"><div class="divider"><span>↔</span></div><span class="tag left">${l}</span><span class="tag right">${r}</span></div><label for="compare-${index}">拖动图片或滑块比较；支持键盘方向键 / Home / End</label><input id="compare-${index}" type="range" min="0" max="100" value="50" aria-label="${title} 对照位置"></section>`;
  })
  .join("\n");
writeFileSync(
  `${output}/comparison.html`,
  `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Marcell.OS v1.5.1 跨设备一致性对照</title><style>
*{box-sizing:border-box}body{margin:0;background:#080d11;color:#e4edf3;font:16px/1.7 system-ui,sans-serif;padding:30px;max-width:1440px;margin:auto}h1{font-size:clamp(24px,4vw,36px);line-height:1.2}p,label{color:#9eafbb}section{margin:48px 0}h2{font-size:19px}.comparison{position:relative;border:1px solid #33414d;overflow:hidden;cursor:ew-resize;touch-action:pan-y}.comparison img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;pointer-events:none}.after{clip-path:inset(0 0 0 var(--split))}.divider{position:absolute;inset:0 auto 0 var(--split);border-left:1px solid #c8dde5a0;pointer-events:none}.divider span{position:absolute;top:50%;transform:translate(-50%,-50%);background:#10212e;border:1px solid #698797;border-radius:50%;width:34px;height:34px;text-align:center;line-height:30px;color:#d2e2e9}.tag{position:absolute;bottom:12px;background:#080d11e8;padding:4px 12px;font-size:12px;pointer-events:none}.left{left:12px}.right{right:12px}label{display:block;margin-top:10px;font-size:13px}input{width:100%;accent-color:#8dcbd9}input:focus-visible{outline:2px solid #acd5e5;outline-offset:6px}@media(max-width:600px){body{padding:16px}.tag{font-size:10px;padding:3px 7px}}
</style><h1>MARCELL.OS v1.5.0 → v1.5.1</h1><p>CROSS-DEVICE VISUAL CONSISTENCY</p><p>真实浏览器截图。DPR 与 WebGL DPR 分开记录；为了便于查看，截图以 CSS 像素保存。升级前后首页的视口一致。Case A / B Core 因构图尺寸不同，使用 contain 居中比较艺术方向，不声称逐像素配准。轨道相位与实时数据可能不同。Windows Scaling 与 Browser Zoom 检查是视口 / DPR 模拟，不能代替真实设备。</p>${sections}<script>
for(const section of document.querySelectorAll('section')){const stage=section.querySelector('.comparison'),range=section.querySelector('input');const set=value=>{const n=Math.max(0,Math.min(100,value));stage.style.setProperty('--split',n+'%');range.value=String(n)};range.addEventListener('input',()=>set(Number(range.value)));const move=e=>{const b=stage.getBoundingClientRect();set((e.clientX-b.left)/b.width*100)};stage.addEventListener('pointerdown',e=>{stage.setPointerCapture(e.pointerId);move(e)});stage.addEventListener('pointermove',e=>{if(stage.hasPointerCapture(e.pointerId))move(e)});stage.addEventListener('pointerup',e=>{if(stage.hasPointerCapture(e.pointerId))stage.releasePointerCapture(e.pointerId)})}
</script></html>`,
  "utf8",
);
console.log(`Saved ${pairs.length} draggable comparisons: ${output}/comparison.html`);
