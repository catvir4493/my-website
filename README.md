# MARCELL.OS v1.4.0 — MATERIAL FIDELITY PASS

Live site: https://marcell-os.vercel.app

v1.4 在既有结构上加入集中材质预设、程序化微表面、解析式工作室反射、烟熏玻璃边缘响应、阳极氧化金属、陶瓷处理层、PCB 焊盘与接触阴影，并细化项目图和手机静态 Core 的表面响应。保留 v1.3 的启动、滚动焦点、项目交接与 Quiet Mode，以及现有内容、路由、GitHub 接口、终端、SEO 和教学算法。参见 [v1.4 材质实施与验证报告](docs/material-fidelity-v1.4.md)；[v1.3 报告](docs/cinematic-interaction-v1.3.md)和 [v1.2 报告](docs/visual-systems-v1.2.md)作为历史记录保留。

对运行中的生产构建进行视觉验证：

```powershell
node scripts/visual-systems-qa.mjs http://localhost:3000 artifacts/v1.4
node scripts/visual-systems-performance.mjs artifacts/v1.4
node scripts/material-captures.mjs http://localhost:3000 artifacts/v1.4/after
node scripts/material-resources.mjs http://localhost:3000 artifacts/v1.4
node scripts/lighthouse-audit.mjs http://localhost:3000 artifacts/v1.4
```

截图及测量记录写入忽略提交的 `artifacts/v1.4/`。性能脚本只统计默认帧缓冲的 Core 呈现帧，排除 PMREM / Transmission 的离屏绘制，不把浏览器 RAF 当作 Core 帧率。资源探针检查 GL 对象生命周期；不等于 GPU 内存字节，也不会显示为硬件遥测。已安装的 Playwright WebKit 用于 Safari 引擎验证，不能替代 Apple 设备上的原生 Safari 测试。

面向 BME Computer Engineering 学生的个人工程作品集。v1.1 延续原有暗色 HUD、字体、页面结构与 Compute Core，补充真实项目案例、公开 GitHub 遥测、终端导航与教学实验。项目事实由作者提供；当前成果与未来工作分开显示，不推断未知日期、技术栈、使用人数或性能基准。

## Stack

Next.js 16 App Router / React 19 / TypeScript / Tailwind CSS 4 + modular CSS / Three.js + React Three Fiber / Framer Motion / Lucide / Playwright + axe-core. 字体通过 `next/font/local` 加载本地 Inter、Space Grotesk、JetBrains Mono。Node.js 20.9+。

## Local development

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

打开 http://localhost:3000。已有 `.env.local` 时请直接编辑，保留本地配置。构建与验证：

```powershell
npm run lint
npm run typecheck
npm run build
npm test
```

Playwright 在 Windows 优先使用已安装的 Microsoft Edge；其他环境先运行 `npx playwright install chromium`，或用 `PLAYWRIGHT_BROWSER_PATH` 指定浏览器。测试启动本地 production server，已有服务可复用。更改 production build 后先重启旧服务。`scripts/next.mjs` 默认关闭 Next.js telemetry，避免 Windows 全局配置跨设备写入问题。

## Environment variables

| Variable                      | Purpose                                                                                      |
| ----------------------------- | -------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`        | 完整站点 URL；生产设置为 `https://marcell-os.vercel.app`，用于 canonical、sitemap 和分享卡片 |
| `GITHUB_USERNAME`             | 服务端公开 GitHub 账号，当前生产为 `catvir4493`                                              |
| `NEXT_PUBLIC_GITHUB_USERNAME` | 可选的公开用户名替代项；服务端变量优先                                                       |
| `GITHUB_TOKEN`                | 可选服务端 token，用于提高 API 配额；无 token 时使用公开 API                                 |
| `NEXT_PUBLIC_GITHUB_URL`      | 未设置用户名时可用的经过验证的 GitHub 联系链接；单独设置 URL 不启动 telemetry                |
| `NEXT_PUBLIC_LINKEDIN_URL`    | 可选真实 LinkedIn 链接                                                                       |
| `NEXT_PUBLIC_CONTACT_EMAIL`   | 可选真实邮箱                                                                                 |

`.env*`（除 `.env.example`）、`.vercel`、`artifacts` 均被 Git 和部署上传排除。不要提交 token，不要使用 `NEXT_PUBLIC_GITHUB_TOKEN`，不要将认证文件放进 `public/`。GitHub token 仅传给固定的 GitHub API origin；返回给浏览器的是经过筛选的公开字段，不返回原始响应或请求头。

## GitHub telemetry

`lib/github.ts` 是 server-only provider，`app/api/github/route.ts` 暴露受控 JSON 接口；`lib/github-data.ts` 负责白名单字段与 public/private 过滤。`components/telemetry/github-panel.tsx` 在进入视口时加载。

- 实际 public repo count 来自账号 API；仓库、主语言和更新时间来自最多 100 个最近更新的公开仓库。语言仅表示这个样本中的仓库主语言，没有熟练度百分比。
- RECENT ACTIVITY 来自公开 event feed；RECENT PUBLIC PUSH 仅使用实际 PushEvent，不以空仓库创建时间或 `pushed_at` 替代。
- GitHub event feed 有有限历史；没有返回事件时明确说明，不推导 contribution / commit / streak 数量。
- 缺少或无效用户名：NOT CONNECTED；缺失语言或 push：DATA UNAVAILABLE；API 失败：GITHUB SIGNAL LOST + Retry。
- 服务端合并并发请求并缓存成功结果 5 分钟；失败尊重 Retry-After / rate-limit reset，短时故障也有冷却。事件 API 单独失败时仓库数据仍可显示，活动显示 DATA UNAVAILABLE。
- API 只读取环境配置的账号，不接受任意用户输入 URL 或 query 覆盖。

## Project content

`data/projects.ts` 保存四个项目的事实、状态、technologies、architecture nodes、challenges、results、futureWork、features、repository / demo 和 images：

1. Vision Navigation：旗舰 Android 原型，CameraX / MediaPipe / EfficientDet-Lite0，风险走廊和语音 / 振动反馈。`~20 FPS` 是作者测试观察值，非标准基准。
2. AirPocket：旅行 / 配送匹配平台概念；Login / Publish Trip / Publish Request / Chat / Orders。已连接公开仓库，并从其源码归档确认 WeChat Mini Program / JavaScript / WXML / WXSS / 微信云开发；已发布源码的实现范围与产品规划分别说明。
3. Swordsmith Notebook / 铸剑师手记：Godot，ACTIVE DEVELOPMENT。已连接作者公开的版本归档仓库。
4. Gomoku AI：C，15×15，Minimax / heuristic search，undo / save / load / configurable depth。

新增项目时向 `projects` 添加完整条目及唯一 id / slug。App Router 会生成详情页、metadata、分享图片和 sitemap 条目；终端、命令面板、主页和 archive 自动读取相同数据。根据真实实现选择 schematic kind，若需要新增视觉类型，在 `ProjectVisual` 中添加对应技术示意。图片放入 `public/projects/<slug>/`，填写 `images` 的 src / alt / caption / width / height，详情页使用 Next Image。没有图片时显示 BUILD ARTIFACT PENDING，不生成假应用截图。不要把示意图标成项目截图。

`data/skills.ts` 用真实 evidence links 关联技能与项目；没有项目证据的 C++ / Python / Git / Linux 保持 Learning。`data/system-log.ts` 保存作者提供的里程碑，未知日期使用分类。`data/contact.ts` 只输出已配置且校验通过的联系渠道，安全的公开链接通过 ContactProvider 传给客户端。

## Terminal / command palette

Ctrl / Cmd + K 打开命令面板：ordered fuzzy search，箭头选择，Enter 导航，Esc 关闭。终端 prompt 为 `marcell@bme:~$`。

支持 `help`, `whoami`, `about`, `education`, `location`, `projects`, `projects --all`, `open <slug>`, `skills`, `lab`, `contact`, `github`, `clear`, `history`, `date`, `neofetch`, `matrix`, `matrix --stop`, `sudo`, `exit`。上下箭头历史、Tab 补全、Ctrl+L 清屏。历史保存在当前打开会话中，最多 200 条。`date` 使用 Budapest 时区。`neofetch` 不编造 uptime 或年龄。所有动作通过固定 allowlist 触发；用户输入从不送入 eval / shell / exec。sudo 是无副作用的文字彩蛋，Matrix 最长 15 秒。

## Engineering Lab

实验入口数据在 `data/lab.ts`，交互组件在 `components/lab/`，纯算法在 `lib/`。标签可用左右箭头 / Home / End，hash 可直接打开，例如 `/lab#memory`。

| Experiment          | Status       | Behavior                                                                                                                                            |
| ------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| EXP_001 Sorting     | ONLINE       | Bubble / Quick / Merge；运行、暂停、单步、随机数组，真实 comparisons / writes                                                                       |
| EXP_002 Pathfinding | ONLINE       | A* / Dijkstra；画墙和端点、Run / Step / Reset / Generate walls；open / closed / current / path；浏览器 performance.now 测量计算时间，动画耗时不计入 |
| EXP_003 Binary      | ONLINE       | Decimal / Binary / Hex / Octal 同步编辑；signed / unsigned；8 / 16 / 32 / 64 位，BigInt 精确计算，输入溢出校验；缩短位宽保留低位并明确提示          |
| EXP_004 Memory      | EXPERIMENTAL | 明确 SIMULATION；64-byte first-fit heap、malloc / free、连续空闲区、stack call / return；不代表浏览器内存                                           |
| EXP_005 CPU         | ONLINE       | 保留原有 fetch / decode / execute、registers 和虚拟内存实验                                                                                         |

增加实验：添加 `data/lab.ts` 条目和 ExperimentId，然后在 `LabWorkbench` 注册图标与 lazy component。复杂计算抽到纯 `lib/` 函数，增加关键算法 / 交互测试。未完成实验不要标 ONLINE。

## Motion, performance, and accessibility

保留原有轻量 Compute Core，项目节点 hover / focus 调整对应信号颜色，click 导航。WebGL DPR 限制为 1–1.5；离开视口和隐藏标签页暂停渲染，移动端与 reduced motion 使用静态 fallback。没有虚构 CPU load。项目、lab 和 terminal 使用语义化链接 / 表单控件、focus styles 和 dialog focus trap。GitHub 的 loading 状态由真实请求驱动，没有人工延时。

## Deployment / verification

生产使用现有 Vercel project `marcell10/marcell-os`。配置生产环境变量后用 `vercel --prod` 部署；`.vercelignore` 排除本地认证、env、测试与构建缓存。不要提交或分享 `artifacts/vercel-auth`。

`npm test` 包含原有回归测试和 v1.1 功能、数据过滤、失败恢复、三个尺寸下七条路由及 WCAG AA 检查。`node scripts/visual-regression.mjs` 保存 desktop / tablet / mobile 页面截图到被忽略的 `artifacts/v1.1/`。可用首个参数指定线上 URL。分享图片由 Next `ImageResponse` 生成品牌文字卡片，不是伪造项目界面。

仍待作者提供：Vision Navigation、Gomoku 的确认仓库链接，以及四个项目的真实截图 / demo（若可公开）。AirPocket 和 Swordsmith Notebook 已连接公开仓库。这些缺口在页面有明确状态，不影响已有案例和实验功能。
