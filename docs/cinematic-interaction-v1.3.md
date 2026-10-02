# MARCELL.OS v1.3.0 · CINEMATIC INTERACTION PASS

本次在 v1.2 上完成交互叙事升级。保留首页内容顺序、项目事实、现有路由、GitHub 接口、教学算法与 SEO；不新增业务功能，不增加粒子数量或渲染器。

## 1. 修改的视觉系统

- `MotionProvider` 增加安静状态、终端焦点和独立的减少动态效果标记。`dormant` 仍表示用户暂停或页面隐藏，不把无操作等同于暂停教学实验。
- `VisualEnvironment` 统一管理阅读焦点、轻微镜头退远、环境光位置和短暂信号交接。滚动位置由原生页面控制；没有滚动劫持或长时间固定主内容。
- `ProjectFocusProvider` 让项目卡与既有 Core 导航共享项目焦点。旧节点只能清除自己的信号，避免跨节点操作时误清除新焦点。
- `ProjectIdentity` 在卡片和详情页之间保留同一个项目编号；项目编号继续使用原有 `001`–`004`。
- `MagneticControls` 仅对既有首页主按钮、Lab 邀请和联系入口提供最大 4px 位移。它使用输入事件触发，不建立空闲 RAF 循环。
- 自定义光标按实际命中表面显示 `OPEN` / `INSPECT` / `TRACE`，普通区域只有小点；滚动也会更新语义，切页清除旧标签，文本输入和终端使用原生光标。
- `cinematic.css` 统一编排镜头、阶段图、焦点、版本状态及质量降级，沿用既有深度与 Motion Tokens。

## 2. 新增的 cinematic transition

- **首页启动：** 环境先存在，Grid 短暂进入焦点，Core 轮廓与线路接通，标题轻微归位。通常 1.3 秒，1.8 秒仅为动画结束事件失败时的保护。旧全屏启动、伪 CPU/内存上线日志及假进度条已移除。
- **非阻塞进入：** 短启动只显示状态提示，不设置 `inert`、不捕获焦点。滚动、键盘或点击都能直接结束；没有等待模型下载的假延时。
- **滚动镜头：** HIGH 下 Core 最多退远 3.5%、移动 8px；HUD 装饰注意力逐渐减弱。段落与标题颜色、透明度保持稳定。
- **项目交接：** HIGH 下图与编号共享元素移动 650ms；详情页以非常浅的位移/比例归位。MEDIUM 保留环境光与轻度位移，LOW 保留简单位移。
- **状态聚焦：** 调色板降低 Core 活动并临时轻模糊背景；终端让环境降亮、恢复标准文本光标。关闭后恢复。

## 3. Section 的连续视觉关系

遵守已批准的信息架构，首页顺序仍为 Hero → Profile → Project Archive → Skills → Telemetry → System Log / Lab 邀请 → Contact。没有按建议顺序重新排列内容，也没有把 Lab 复制成新首页模块。

同一短暂分支信号在模块交接时延续“身份节点 → 项目结构 → 技能连接 → 活动信号”的概念。它仅在焦点切换时出现一次，持续 700ms；Contact 不再显示该装饰。

当前阅读模块的面板底色与边缘略增强，已读模块的装饰强度约 60%，后续模块约 70%。调整仅作用于背景和装饰，正文不降透明度。ResizeObserver 缓存几何位置，滚动事件只安排一帧更新。IntersectionObserver 管理技术图的可见性和首次接通；MutationObserver 补上真实加载状态到内容的接管。

## 4. Project 打开动画

保留原生 Next.js `Link`、预取、键盘与修饰键行为。`onNavigate` 只记录选择，不 `preventDefault`，不等待动画后再导航。

点击立即进入 `LOCKED` 状态，显示既有项目编号和名称；其他项目只降低图形层的注意力。卡片技术图放大 2%，随后与详情 Hero 的相同图及编号共享身份。项目大号编号只在关注/选择时显示，透明度 4%。

共享标识等到实际项目 article 出现后才显示 `MODULE READY`，再于 650ms 后收束。真实加载时使用 `RESOLVING MODULE`；取消/返回清除选择，保留保护性超时。没有人为拉长路由加载，也没有 spinner。缺少浏览器共享元素能力时，编号提示、局部颜色和归位动画继续提供连续性。

## 5. 四个项目的视觉语言

| 项目                | 叙事顺序                                                                          | 限制与事实边界                                                                            |
| ------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Vision Navigation   | CameraX 框 → 检测框 → 左/中/右空间 → 中央风险 → Decision → Voice / Vibration      | 6.4 秒慢序列；明确标注合成系统图，非运行截图                                              |
| AirPocket           | Budapest → Vienna → 旅行路线 → 请求 → 匹配 → Chat → Order                         | 抽象网络拓扑；地点与流程是示例，不伪造订单或地图                                          |
| Swordsmith Notebook | Main Menu → Game State → Dialogue → Inventory → Chapters → Archive                | 保留极弱暖色反射，不添加火焰或新粒子                                                      |
| Gomoku AI           | 15×15 棋盘 → 候选 → Minimax 分支 → 叶值及 MIN/MAX 回传 → 其他候选减弱 → Best Move | 示例叶值 4/2 与 −1/1，MIN 得到 2/−1，MAX 选择 2；数值明确为示意，不表示运行评估或神经网络 |

小型技术图进入视口时只运行一次信号，之后保持静态。大 Hero 才有 6.4 秒阶段序列；离开视口停止，进入安静状态时直接保留完整静态图。

Vision 的既有四个案例段落驱动侧栏同一图逐步解释 RAW DETECTION → SPATIAL INTERPRETATION → RISK CORRIDOR → ACTIONABLE FEEDBACK。侧栏沿用原本的 sticky 位置；不固定主文、不改变滚动速度、不改写案例内容。窄屏隐藏这个重复辅助图，主 Hero 和案例正文仍完整可读。

## 6. Terminal / Command Palette 的环境状态

两种面板都使用统一 `FOCUS` 状态。调色板保留键盘焦点、背景 `inert` 和已选行信号；HIGH 下只让局部 Core / 项目图临时模糊 1.5px。性能复查后移除了旧有的 6–8px 全屏 backdrop blur，也移除了整个 main 的滤镜，避免重复处理大面积图层。终端降低环境光，Header 显示 `SYSTEM SHELL ACTIVE`，关闭自定义光标以便选择和输入文本。焦点循环、Escape、历史、补全、命令导航及 GitHub 行为保持原实现。

Core 在面板模式按现有约 10fps 节奏调度，不播放闲置数据脉冲；FocusTicker 暂停更新。没有声音系统或自动播放。

## 7. Mobile 降级

LOW 使用既有静态 Core、项目本地光、完整合成图与简单位移。没有 WebGL、全局鼠标视差、自定义光标、磁吸或章节信号线。小信号可进入视口运行一次；不复制桌面镜头运动。移动菜单、项目导航、终端、教学实验和触摸行为保留。

## 8. Reduced Motion 与页面隐藏

减少动态效果时，Core 使用静态版本，所有 cinematic / 共享元素 / SVG 信号动画关闭；文字与功能即时切换。已有用户暂停按钮继续可用。页面隐藏停止 Core 调度与现有非必要动画；返回后以受限的时间增量恢复，不让 Core 跳过长时间轴。

约 12 秒没有鼠标、键盘、触摸或滚动操作时，Quiet Mode 停止 Core 帧调度、数据脉冲与 FocusTicker，并收束装饰动画。任何新输入重新唤醒；不显示额外状态文字，也不冻结正在执行的教学算法。

## 9. 性能变化

维持原有 HIGH / MEDIUM / LOW、自适应 DPR、实例化几何和单个 WebGL 渲染器。HIGH 仍最多 48 个稀疏点，MEDIUM 16 个；DPR 上限分别为 1.5 / 1.25，没有加大几何或纹理。闲置线路改为 2–7 秒不规则间隔的稀疏活动，内部模块只极慢转动。架构图原先的永久循环也改为进入视口后运行一次。

本次独立运行的 Core 实际 GL 帧率：

| 状态                                           | Core 帧率 |
| ---------------------------------------------- | --------: |
| 可见空闲                                       |  20.51fps |
| 项目交互                                       |  29.97fps |
| 命令模式                                       |   9.99fps |
| 离屏 / 用户暂停 / 模拟隐藏 / Quiet Mode / 手机 |      0fps |

每帧约 21–22 次绘制。测量同时观察到 Core 导航和卡片导航各一次原生 View Transition。主线程记录为空闲约 148ms/s、交互约 206ms/s、命令模式约 147ms/s、Quiet Mode 约 33ms/s。复查前叠加模糊的命令模式记录约 300ms/s，因此最终删除了该低回报效果；这不是对所有设备的性能提升承诺。

运行探针使用 headless Chromium / Edge，WebGL 可能由软件渲染。主线程 TaskDuration 不等于整机 CPU / GPU 使用率；探针本身包含 RAF 采样，浏览器 RAF 也不等于 Core 帧率。页面隐藏通过 visibilitychange 模拟检查。没有把这些测量显示为网站的虚构遥测。

## 10. Lighthouse

2026 年 10 月 2 日对本地生产构建独立运行 Lighthouse 13.5，使用默认模拟节流及桌面 preset；没有同时运行截图或测试负载。

| 类别           | Desktop |  Mobile |
| -------------- | ------: | ------: |
| Performance    |  **98** |  **92** |
| Accessibility  | **100** | **100** |
| Best Practices | **100** | **100** |
| SEO            | **100** | **100** |
| FCP            |  0.244s |  0.904s |
| LCP            |  0.942s |  3.368s |
| TBT            |   115ms |   4.5ms |
| CLS            |       0 |       0 |

满足本轮 Desktop ≥95 / Mobile ≥90 的目标。v1.2 归档分数为 97 / 92；本次为 98 / 92，但并非受控的同轮版本对比，不据此宣称全面加速。两次 Lighthouse 均没有 runWarnings。以上不是 Vercel 生产域名的 Lighthouse 测量。

## 11. Build / lint / typecheck / test 与视觉 QA

| 检查                | 结果                                                                               |
| ------------------- | ---------------------------------------------------------------------------------- |
| `npm run build`     | 通过；保留全部路由与 13 个静态输出                                                 |
| `npm run lint`      | 通过；无警告                                                                       |
| `npm run typecheck` | 通过                                                                               |
| `npm test`          | **48 项全部通过**；其中 v1.3 新增 9 项行为检查                                     |
| Chromium            | 1920×1080、1440×900、1366×768、820×1180、390×844；35 个路由检查，无溢出或页面错误  |
| WebKit              | 桌面 / 手机共 14 个路由检查，包含移动菜单、调色板、项目导航；无页面错误            |
| Cinematic QA        | 六个首页模块、四个 Vision 叙事阶段、首次启动及项目 / 终端 / 调色板交接；无页面错误 |

记录包含 62 张标准 Chromium 截图、22 张 cinematic 截图和 2 张 WebKit 截图，保存在忽略提交的 `artifacts/v1.3/`。人工检查了首页、项目卡、Vision Hero / 侧栏、终端、调色板及手机构图。WebKit 是 Safari 引擎验证，Apple 硬件上的原生 Safari 尚未实测。发布状态另在交付消息中报告。

可重跑的命令：

```powershell
npm run lint
npm run typecheck
npm test
npm run build
node scripts/visual-systems-qa.mjs http://localhost:3000 artifacts/v1.3
node scripts/cinematic-captures.mjs http://localhost:3000 artifacts/v1.3
node scripts/visual-systems-performance.mjs artifacts/v1.3
node scripts/lighthouse-audit.mjs http://localhost:3000 artifacts/v1.3
```

## 12. 放弃的效果与原因

- 没有增加粒子、HUD 面板、Bloom、发光饱和度、扫描线、Glitch、额外 Canvas 或 WebGL 渲染器；它们无法改善本次注意力与节奏问题。
- 没有为 Swordsmith 添加火花；既有低强度暖光足以表达项目差异。
- 没有长时间 pin 主页面、滚动劫持、强透视、激进 Tilt 或把所有按钮磁吸；保留阅读和输入控制。
- 没有把正文模糊或降到 50%–70% 透明度；视觉焦点通过装饰层完成。
- 没有路由人为延时、长启动、假加载、声音设置入口或声音系统；快速资源直接接管。
- 没有新增业务功能、虚构遥测、产品截图或项目事实；保留 v1.2 作为独立历史版本。
