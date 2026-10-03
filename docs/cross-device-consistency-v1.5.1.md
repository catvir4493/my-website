# MARCELL.OS v1.5.1 — CROSS-DEVICE VISUAL CONSISTENCY

本轮在现有 v1.5 上修复判断与适配。项目内容、GitHub provider、Terminal、Command Palette、Lab 算法、路由、SEO、材质库与光学 Shader 保留。没有增加几何、Bloom、SSAO、Transmission、HDR 或粒子。

## 1. 原因定位

实测旧版 840×849 / DPR 1.75 **已是 HIGH**，1919×1568 / DPR 1 也是 HIGH。因此不能声称这两个实测环境之间必然发生了质量降档。旧版同时存在：宽度 ≤760 或 reduced motion 自动 LOW；1000px 以下收缩标题与 HUD；材质细节按投影尺寸在 65–115 阈值渐隐。这些因素共同造成窄窗口的视觉层级与完整度差异。旧版截图已保存，不用推测截图代替证据。

## 2. 原 quality 判断的问题

`lib/visual-quality.ts` 原先把宽度、动态偏好、CPU 并发和 Save-Data 放进同一决策；没有检查 WebGL2、实际上下文、纹理限制或 Shader 精度。窗口跨越 760px 会切换画质、卸载 Core；reduced motion 也会卸载它。Save-Data 是网络偏好，不能证明 GPU 能力不足。

## 3. Layout / Graphics / Input / Motion 拆分

新增 `lib/graphics/capabilities.ts` 和 `lib/graphics/profile.ts`。`GraphicsProfile` 分别记录布局、画质、DPR、渲染 DPR / scale、WebGL 能力、指针、hover、触屏、动态偏好、可见性、静态手机策略和决策原因。原接口保留兼容导出；旧 `lite` 消费者现在只读取动态偏好与手机产品策略。

自动画质在当前页面会话中只检测一次；App Router 导航、resize、旋转、DPR 和 reduced motion 变化不重新选档。采用内存缓存，不持久化硬件数据，不加入会抖动的动态 FPS 降级。手动 URL override 始终优先。

## 4. Compact Desktop

基础分类：<640 Phone；640–899 根据 primary fine pointer + hover 选择 Compact Desktop 或 Tablet；900–1199 Compact Desktop；1200–1799 Desktop；≥1800 Wide Desktop。`maxTouchPoints` 不把触屏笔记本变成 Tablet。没有 DPR=1.75 / width=840 特判，也不把物理像素当 CSS 布局像素。

`app/styles/cross-device.css` 提供混合双栏 Hero、紧凑导航、两列项目 / 模块、较紧标题和 HUD。保持 Core、项目 hover、Terminal 与 Palette。Phone 和触控 Tablet 的堆叠布局与桌面画质互不绑定。原项目信息架构保留。

## 5. 高 DPI laptop

840px fine + hover 进入 Compact Desktop；可继续使用 HIGH / MEDIUM WebGL 材质。屏幕 CSS 尺寸提供给诊断，不用不可靠的物理分辨率推算判定设备。针对小窗口，材质投影 LOD 阈值从 65–115 校准到 40–70，使紧凑构图保持材质身份；真正很小的 Core 仍抑制亚像素细节。

## 6. DPR 只控制 render resolution

HIGH：`min(deviceDPR, 1.5)`；MEDIUM：`min(deviceDPR, 1.25)`；LOW 上限 1，Core 为静态。`renderScale = renderDPR / deviceDPR`。DPR 1.75 下 HIGH 使用 1.5，材质仍是 HIGH。R3F 接收明确的数值 DPR；监听 resolution media query 与 resize，实际 renderer DPR 通过 `gl.getPixelRatio()` 记录。

## 7. 高 DPR 不再降级材质

画质决策函数不接收 viewport、DPR、布局、pointer 或 reduced motion。窗口变窄只重排；跨屏 DPR 变化只调整 framebuffer 分辨率。材质 `useMemo` 依赖 quality / optics mode，不依赖布局或 DPR。

## 8. Capability Probe

检查 WebGL2 上下文成功、MAX_TEXTURE_SIZE、MAX_RENDERBUFFER_SIZE、fragment HIGH_FLOAT precision、hardwareConcurrency、可用时的 deviceMemory。HIGH 要求纹理 / renderbuffer ≥8192、精度 ≥23、CPU hint >4、已提供的内存 hint ≥4GB；支持但信息不完整 / 较弱时 MEDIUM；不支持 WebGL2，或已知纹理 / buffer <2048 / precision <16 时 LOW。

优先用一次性 `public/graphics-capabilities.worker.js` + OffscreenCanvas 检测，完成后 terminate；无持续探针 / benchmark。Worker / OffscreenCanvas 不支持时，在首次绘制后的空闲任务回退主线程。触屏 Phone 的静态产品策略没有 WebGL 消费者，普通访问不唤醒 GPU；GPU limits 未测量时按未知能力选 MEDIUM，并明确标记 deferred，而非宣称 GPU 不支持。显式 debug 或首次需要 WebGL 时执行完整检测；已有保守会话预算在旋转 / resize 后保留，只有确认不支持的能力证据可进入 LOW。主线程可立即显示完整内容与静态 Core，不等待检测才能排版。方法依据 [OffscreenCanvas getContext 文档](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas/getContext)。

一次性 Worker 只向同一页面返回本地结果。没有硬件信息上传、analytics、localStorage、Battery API、GPU 型号匹配或操作系统猜测。

## 9. Quality 参数

`?quality=high`、`?quality=medium`、`?quality=low`；删除参数 / `quality=auto` 恢复当前会话自动决策。只改变图形档位，不改布局。强制 HIGH 不能绕过无 WebGL 的安全 fallback，也不会取消触屏手机的静态产品策略。通过独立 Suspense 内的 `useSearchParams` 同步客户端导航和浏览器前进 / 后退，页面继续静态预渲染。

## 10. Debug 参数

`https://marcell-os.vercel.app/?debugGraphics=1` 显式开启只读诊断；普通生产访问无面板，也不加载面板组件。可折叠，手机测试点击前可以收起。`?debugGraphics=1&layout=phone|tablet|compact|desktop|wide` 用于调试布局；生产中没有 debug 参数时忽略 layout override。

## 11. Debug Overlay 字段

显示 layout、selected / auto quality、CSS viewport、screen **CSS pixels**、device DPR、实际 WebGL DPR、configured DPR / scale、WebGL 状态、probe method、pointer、hover、touch points、reduced motion、实际 Core mode、phone static policy、实际 material / optics mode、Fresnel、micro surface、signal optics、配置 FPS 上限、GPU limits、CPU / memory hints 与 WHY THIS QUALITY。

不推算物理屏幕分辨率。FPS 标签明确为配置上限，不是运行时 FPS。Shader 退回 legacy 或 static 时按实际 DOM 状态报告，不把请求的 HIGH 当作已经呈现的完整材质。

## 12. Case A：840×849 @ DPR 1.75

AUTO 与 HIGH 均为 Compact Desktop + HIGH material + optics，实际 WebGL DPR 1.5。MEDIUM 保持同样布局，实际 DPR 1.25；LOW 仍为 Compact Desktop，静态材质组合。没有溢出、Shader / page error；精细指针保留 cursor / hover。触屏笔记本模拟同样通过。

## 13. Case B：1919×1568 @ DPR 1

Wide Desktop + AUTO HIGH，实际 WebGL DPR 1。和 Case A 同能力、同画质；区别是构图密度与 framebuffer 像素数。两种 Core 截图在比较器中居中查看艺术方向，不声称像素配准。

## 14. Browser Zoom

模拟 80 / 90 / 100 / 110 / 125% 对 CSS viewport 和 DPR 的组合影响，画质均保持 HIGH。另在同一个 renderer 上改变 viewport / DPR，验证 Canvas 身份和上下文数不变。没有自动操作真实浏览器菜单缩放，保留真实设备验收项。

## 15. Windows Scaling 模拟

100 / 125 / 150 / 175 / 200% 使用 CSS viewport / deviceScaleFactor 模拟。全部保持 HIGH；布局随可用 CSS 宽度变化。独立加入用户的 840×849 / 1.75 和 1919×1568 / 1 案例，不假定缩放比例可以唯一反推 docked DevTools 下的 viewport。无需改 Windows 为 100%，也无需关闭 DevTools。

## 16. HIGH / MEDIUM / LOW 艺术方向

HIGH 保留现有完整 micro surface / Fresnel / optics；MEDIUM 保留同一种金属、玻璃、PCB 和光照方向，减少微表面与光学开销；LOW 复用现有金属边缘、烟熏玻璃、PCB、cyan 内光和 violet orbit 的静态组合。sRGB outputColorSpace、ACESFilmicToneMapping、exposure=1 保留；没有 ICC / HDR 主题推测。

| 能力             | HIGH                     | MEDIUM         | LOW            |
| ---------------- | ------------------------ | -------------- | -------------- |
| Core WebGL       | 是（受独立产品策略约束） | 是（同前）     | 否             |
| Micro Surface    | 完整，尺寸 LOD           | 简化           | 静态表面       |
| Fresnel / Optics | 完整                     | 简化但同方向   | CSS 近似       |
| Signals          | 稀疏运动                 | 稀疏运动       | 静态           |
| Cursor / Hover   | 取决于输入方式           | 取决于输入方式 | 取决于输入方式 |
| Reduced Motion   | 冻结运动，保留材质       | 同前           | 静态           |

## 17. Mobile 与 Graphics 解耦

仅 Phone + 非 fine/hover primary input 使用 `mobileStaticCorePolicy`，以功耗和 UX 为理由记录。普通静态手机的未测量 GPU limits 使用 MEDIUM 保守预算；显式 debug 进行完整检测后可选 HIGH，强制 HIGH 始终是 Phone 布局与 HIGH profile，Core 保持静态。这个差别来自是否需要探测未使用的 GPU 功能，而非手机能力不足的推断。390px 桌面窗口的 fine/hover input 可继续 WebGL；不因宽度单独卸载 renderer。手机项目示意图依产品策略执行一次信号，不转成无限循环；传感器装饰保持静态。所有未进入视口的示意动画在 hydration 前即暂停，减少首次绘制开销。

## 18. Reduced Motion 解耦

保持同一个 renderer 和 material quality；camera breathing / pointer parallax / orbit / light sweep / pulse movement 停止。初始化光学 gain 直接为 1，防止冻结在尚未显现的 boot stage。材质细节、边缘高光、静态光源和现有 diagram 光照保留。Demand 模式在状态 / 尺寸改变时绘制一次，稳定后无连续 Core 帧。

## 19. Draw Calls 与资源

没有增加几何或 render passes，保持约 28–29 draw calls / Core frame。资源探针先等待已有稀疏 pulse 第一次出现，区分一次性 buffer 上传和泄漏。稳态 7 textures / 118 buffers / 15 programs / 3 framebuffers；连续 12 次项目 hover、跨 1919→840→640→390→1440 和 reduced motion 后保持不变。稀疏 pulse 尚未上传时为 112 buffers；第一次出现增加 6 个既有 buffers，之后稳定。明确 LOW 与离开 Core 路由时释放上下文。

这些是 GL 对象计数，不是显存字节，不能据此声称绝对 GPU 内存或真实硬件占用百分比。

## 20. FPS / Idle

最终测量见 `artifacts/v1.5.1/runtime-performance.json`。统计默认 framebuffer clears，不把浏览器 RAF 或 shader 编译当成 Core 呈现帧。HIGH idle 约20、active 约30；MEDIUM 约20；Terminal / Palette 约10。Compact 840 / DPR1.75 保持相同上限。Offscreen、hidden（模拟）、pause、Quiet、Reduced Motion 和触屏手机稳定后均为0连续帧。

| 场景 | 实测 Core FPS | Renderer 主线程工作量（ms/s） |
| --- | --- | --- |
| HIGH idle | 19.99 | 138.83 |
| HIGH project hover | 29.95 | 185.23 |
| Compact HIGH idle | 19.95 | 70.35 |
| Compact HIGH hover | 30.54 | 116.48 |
| MEDIUM idle / hover | 19.97 / 19.97 | 42.04 / 66.39 |
| Terminal / Palette（HIGH） | 9.99 / 9.99 | 91.37 / 91.04 |
| Reduced Motion | 0 | 12.65 |
| Quiet | 0 | 14.16 |
| Phone static | 0 | 73.83 |

短窗口帧计数可略超目标上限，不表示配置升档。Core 导航观察到一次原生 View Transition 与一次共享 diagram transition；其采样包含 Core 卸载，不能把平均 Core FPS 当作掉帧。上述主线程工作量仍包括页面其他组件，Phone 的 0 Core 帧不代表整个页面没有工作。

记录 CDP TaskDuration 作为 renderer 主线程工作量，不声称总 CPU / GPU 使用率。性能测量单独执行，headless 可能使用软件 GPU，不能代替原生笔记本帧率基准。

## 21. Lighthouse

最终本地生产构建（Lighthouse 13.5，Edge headless，默认模拟节流；不是 Vercel公网实机分数）：

| 指标 | Desktop | Mobile |
| --- | --- | --- |
| Performance | 100 | 91 |
| Accessibility | 100 | 100 |
| Best Practices | 100 | 100 |
| SEO | 100 | 100 |
| FCP | 248.67ms | 906.93ms |
| LCP | 687.84ms | 3444.37ms |
| TBT | 20.17ms | 32ms |
| CLS | 0 | 0 |

两种模式 warnings 为空。同步探针曾导致83 / 63的回归；Worker 降低主线程阻塞，但静态手机上无用的 GPU 唤醒仍造成冷启动波动。最终静态路径不初始化未使用的 GPU，预算恢复至100 / 91。不是通过设备名称降低材质档位，也没有选择较好的历史分数。JSON / HTML / trace 保存在 artifacts/v1.5.1/。

## 22. Chromium / WebKit

130 个矩阵场景：Chromium 106、WebKit 24。包括 11 个 viewport × 5 DPR、四种画质、触屏手机 / 笔记本、Tablet、Reduced Motion、四项目详情、archive 和 Lab。WebKit 特别覆盖 DPR2 Compact HIGH / MEDIUM / LOW、手机与 reduced motion。另有14项跨浏览器策略测试：不可用、未知精度、弱 limits、CPU MEDIUM、hover none、pointer none、稳定 resize / DPR / motion。

没有 overflow / page / shader errors。Playwright WebKit 属于引擎验证，不等于 macOS / iOS 原生 Safari 或真实 Retina 面板验证。

## 23. lint / typecheck / build / tests

`npm run lint`、`npm run typecheck`、`npm run build` 通过；13个静态生成输出与既有动态 API / 分享图路由保留。`npm run test` 59项，覆盖算法、数据过滤、失败状态、Terminal、Palette、键盘、Core、项目、Lab、responsive、reduced motion、WCAG AA 和本轮决策 / 稳定性。旧测试中把 reduced motion 当作 WebGL 卸载的断言，更新为同 renderer 静止；不是删除功能验收。

## 24. 上线验证

已部署至 [原生产域名](https://marcell-os.vercel.app/)，Vercel inspect 确认 production / READY，原域名 alias 指向本轮部署。云端 `npm run build`、TypeScript 与13个静态输出全部成功。

- 源代码提交：[68cf142](https://github.com/catvir4493/my-website/commit/68cf1423dae686343986e83c4f8e59c82b9c2feb)，已推送 origin/main；此前 v1.5 历史保留。
- 部署 ID：`dpl_CDWiKNsMaq4ad8DiMHeda5ERZ4o4`；[Vercel deployment](https://vercel.com/marcell10/marcell-os/CDWiKNsMaq4ad8DiMHeda5ERZ4o4)。部署 URL：`https://marcell-6zgsvkzhv-marcell10.vercel.app`。
- 线上 smoke 开始时间：2026-10-03 00:04:43 UTC。`graphics-production-smoke.mjs` 直接访问原域名，不使用 mock GitHub。
- 1440×900 / DPR1.25、840×849 / DPR1.75、390×844 / DPR2，分别验证首页、archive、四个项目详情及 Lab，共21次路由访问：全部200、无横向溢出、版本和 release label 正确。
- 三种尺寸均通过 Terminal neofetch、Palette fuzzy search / keyboard Enter、Core keyboard navigation、项目卡片导航、memory malloc / free 和 pathfinding Step。
- 桌面 / Compact 实测 HIGH + Worker probe；普通手机 Phone + MEDIUM + deferred probe + 独立静态策略。线上 debug + forced HIGH + reduced motion：同材质光学正常，Core frozen，实际 WebGL DPR1.5。
- `/api/github` 返回200、`connected`、真实账号 `catvir4493`。page / console errors为空。
- 线上截图与完整断言记录：`artifacts/v1.5.1/deployment/`。截图 / smoke JSON 只作本地验收证据，不上传生产包。

完整报告的部署记录另建独立文档提交推送；生产应用代码对应上述68cf142，文档提交不改变运行时内容。

## 25. 真实硬件差异与验收

自动化不能确认用户原机的 GPU driver / hardware acceleration、Windows实际125–200% scaling、浏览器菜单 zoom、跨实体显示器拖动、ICC / HDR / 显示亮度、Apple 原生 Safari 和真实系统 CPU / GPU 占用。网站只保持正确 SDR / sRGB 管线，不根据操作系统推测主题。

在原 Windows 笔记本保持现有 scaling / DevTools 状态，打开 `https://marcell-os.vercel.app/?debugGraphics=1`，控制台检查：

```js
window.innerWidth;
window.innerHeight;
window.devicePixelRatio;
```

应看到布局随窗口变动，graphics quality 稳定；DPR变化仅更新受限 WebGL DPR。可用 `?quality=high&debugGraphics=1` 对照自动档位，查看WHY；手机静态策略和 reduced motion 是独立状态。

## 文件与产物

新增：capabilities / profile、一次性 Worker、GraphicsDebug、cross-device.css、v1.5.1 tests、baseline / matrix / controls / comparison / production smoke 脚本。修改：MotionProvider、Core / CoreScene、Cursor、CursorGlow、MagneticControls、VisualEnvironment、ProjectVisual、既有性能 / 资源 / QA 脚本和版本。

`artifacts/v1.5.1/comparison.html` 包含7组图片 / 滑块，支持直接拖动、方向键、Home / End；实际旧版截图在 before/。截图、JSON、Lighthouse、认证和缓存不进入 Git 或部署。历史 v1.2–v1.5 报告原样保留。

没有加入动态画质升降、GPU名字匹配、Battery API、Terminal graphics 指令、新 Shader、离屏后期处理或新装饰，以避免复杂度和新性能成本。
