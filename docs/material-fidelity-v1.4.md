# MARCELL.OS v1.4.0 · MATERIAL FIDELITY PASS

本轮只提升既有表面、光照响应和材质实现。没有新增项目、业务功能或布局，没有改写项目事实、首页顺序、案例内容、GitHub 接口及教学算法。v1.2 / v1.3 的报告与 Git 历史继续保留。

## 1. 新增材质与统一系统

`lib/materials/tokens.ts` 集中定义六级黑、粗糙度、金属度、IOR、厚度、Clearcoat、发光、反射、微法线与质量覆盖。预设包含 INDUSTRIAL_METAL、SMOKED_GLASS、TECH_ACRYLIC、DARK_PCB、CERAMIC_DIE、GRAPHITE、EMISSIVE_TRACE、MATTE_PANEL。

`lib/materials/library.ts` 创建并复用 Core 的金属、触点、PCB、陶瓷、石墨、亚克力、玻璃、局部线路、哑光隔层、丝印、蚀刻和接触阴影材质。每个质量版本只创建一次；卸载或换质量时统一 dispose。材质不在每帧重新创建。

GLSL 拆分为 `micro-surface.ts`、`glass.ts`、`studio.ts`、`contact.ts`，替代旧 `core-material.ts`。`app/styles/materials.css` 管理 DOM 表面、项目材料差异、物理 LED 外壳与手机静态 Core。

## 2. Compute Core 表面变化

| 表面     | 最终变化                                                            |
| -------- | ------------------------------------------------------------------- |
| 外框     | 深石墨阳极氧化金属，真实倒角、宽而克制的高光、轻微加工方向细节      |
| 保护板   | 有实体侧面的烟熏玻璃，角度相关反射与厚度吸收近似                    |
| PCB      | 蓝黑／墨绿的近哑光底板，细线路、32 个焊盘、32 个 vias、三个少量标识 |
| 处理模块 | 陶瓷与石墨交替表面，较柔和的反射，保留原有实例化与微量内部运动      |
| 支撑件   | 四个实例化工程亚克力支撑，粗糙反射和低强度 Clearcoat                |
| 结构隔层 | 哑光暗色与两处局部接触阴影，区分外壳、PCB 和处理器                  |
| 标识     | 玻璃表面独立蚀刻层，避免内部光学效果损害品牌标识清晰度              |

粒子数量、单 Canvas、轨道结构、项目导航和鼠标交互保持既有架构。没有把 PCB 改成整块发光表面。

## 3. Glass Shader

使用由 IOR 1.45 推导的 Schlick Fresnel；中心区域清晰，斜角增加反射。厚度参数参与吸收近似，几何侧面负责可见边缘厚度。程序化低幅表面变化与解析式工作室反射帮助区分烟熏玻璃和亚克力。

HIGH 的玻璃边缘有最多 2.5% 的冷青／紫色角度变化；这是薄膜颜色的视觉近似，不是 Three.js 的物理 Iridescence 模型。没有水波、色散、彩虹玻璃或明显图像扭曲。

最终采用透明混合的轻量玻璃，不采样屏幕背景，不做真实折射。测试过真实 Transmission 后，因初始编译成本和内部标识清晰度不足而撤下，见第 16 项。

## 4. 金属

外框 metalness 0.86、roughness 0.46；高光保留较宽轮廓，不做镜面。倒角直接提供形状边缘；程序化方向纹理改变粗糙度与法线，正常观看距离不展示明显划痕或污渍。

HIGH 外框使用原生 Anisotropy 0.16 和 Clearcoat 0.06。其他触点共享独立材质，避免所有金属同一个反射强度。没有锈蚀、破损、指纹或游戏式边缘磨损。

## 5. PCB

PCB metalness 0.12、roughness 0.86，反射强度约为金属的八分之一。微表面噪声参与光线响应；焊盘与 vias 合为两个实例化绘制，不逐个建立独立材质。`A14`、`P03`、`DATA_BUS` 为结构标识，不表示遥测。

原有三条稀疏信号路径继续保留。修复了路径切换时替换 BufferAttribute 带来的旧 GPU 缓冲区累积：现在复用同一个位置缓冲区，只更新内容。

## 6. Transmission / Iridescence / Anisotropy

| 效果         | 最终生产方案                                                        |
| ------------ | ------------------------------------------------------------------- |
| Transmission | 所有质量等级关闭真实 Transmission；保留目标 Token，当前预算覆盖为 0 |
| Refraction   | 未采用屏幕折射；保持内部线路和文字清晰                              |
| Iridescence  | 未采用原生物理 Iridescence；HIGH 仅有弱角度颜色近似                 |
| Anisotropy   | HIGH 金属外框原生 0.16；MEDIUM / LOW 关闭                           |
| Clearcoat    | HIGH 金属少量使用；亚克力 HIGH / MEDIUM 0.12；LOW 关闭              |

以上是最终实现边界，不把透明混合称作真实物理透射。

## 7. Selective Bloom

没有加入 Selective Bloom 或全局 Bloom。局部线路使用低强度 emissive；LED 用暗色外壳、小亮点、微弱反射和极细光晕。DOM 信号只保留细中心、弱 falloff 与原有 traveling pulse。

资源探针生成了关闭内部 emissive 的对照截图；金属、玻璃、陶瓷、PCB 与接触边缘仍有可读结构。轨道和 HUD 作为独立界面线继续显示。

## 8. Lighting Rig 与反射

保留一处动态项目 Point Light，使用冷青 Key、蓝灰 Fill、很弱的紫色 Rim 与 Hemisphere 填充。相比旧场景减少一个 Point Light；不启用实时阴影。

工作室软箱反射使用统一解析式 Shader：根据反射方向和粗糙度计算不同宽度的弱亮面，再按材质单独控制反射强度。它是环境反射的低成本近似，不是 HDR / PMREM 贴图，也不增加网络资源、额外 Canvas 或离屏环境绘制。

鼠标只轻微移动 Key Light 的方向。外框每 8–20 秒可出现一次约 2.2 秒的微弱反射变化，Quiet Mode、命令模式和暂停状态停止该活动。

显式保持 ACESFilmicToneMapping、exposure 1、sRGB 输出。两张 512×512 程序化标识纹理使用 sRGB；未引入外部照片、4K 纹理或 HDR 文件，也未添加旧版 physicallyCorrectLights API。

## 9. Mobile 与 Reduced Motion

手机继续使用静态 Core：保留金属触点、烟熏玻璃中心、接触边缘、高光和淡环境梯度，不加载 WebGL 材质、Transmission、Anisotropy 或后期处理。

四个项目的材料差异也保留在 SVG / CSS：Vision 的浅光学玻璃、AirPocket 的轻透明层、Swordsmith 的哑光金属与弱暖反射、Gomoku 的石墨底板与陶瓷棋子。它们仍是明确标注的合成系统图，不是产品截图。

减少动态效果继续走 LOW 静态分支，关闭 cinematic 动作、信号动画、磁吸及视差；键盘、终端、实验和项目导航不受影响。

## 10. HIGH / MEDIUM / LOW

| 模式   | 材质与运行方式                                                                                 |
| ------ | ---------------------------------------------------------------------------------------------- |
| HIGH   | PBR、原生弱 Anisotropy / Clearcoat、完整微法线与粗糙度变化、解析反射、弱玻璃边缘颜色；DPR ≤1.5 |
| MEDIUM | Standard 金属、较低微法线及表面变化、反射强度降低、玻璃不使用边缘色变化；DPR ≤1.25             |
| LOW    | 无 WebGL，静态 CSS / SVG 金属、玻璃与接触边缘；无后期处理                                      |

沿用现有设备能力、saveData、viewport 与 Reduced Motion 判断；不增加指纹检测。原有 HIGH 48 / MEDIUM 16 个稀疏点保持不变。

## 11. 性能与资源

`MaterialRenderer` 在真实材质就绪前复用静态 Core，并调用当前 Three.js 的 `compileAsync`。单一 demand renderer 在编译完成后接管绘制，避免首次使用 shader 时同步阻塞 UI；没有假加载或人为等待。取消、卸载和质量变化不会继续接管旧场景。

最终资源探针记录 HIGH 初始化与 12 次项目信号切换后均为：7 个 Texture、112 个 Buffer、15 个 Program、3 个 Framebuffer。恢复 HIGH 后数量相同；切页及进入 LOW 时旧上下文释放。数字来自探针，不显示在网站中。

资源计数观察 GL 对象生命周期，不表示 GPU 内存字节。浏览器自身的默认纹理与帧缓冲也在计数中；最终场景没有自建后处理或透射 pass。

本轮升级前的空闲样本每帧约 22.5 次绘制，最终约 28.7 次。新增焊盘、支撑、蚀刻与接触阴影有明确几何成本；最终样本的离屏 pass 为 0。空闲主线程由约 170ms/s 变为 189ms/s；帧率仍受原有上限控制。

这是同一环境的独立短样本，并非整机 CPU / GPU 基准或所有设备的速度承诺。Headless Chromium / Edge 可能使用软件 WebGL；TaskDuration 只观察渲染器主线程，探针自身也有 RAF 采样，隐藏状态通过 visibilitychange 模拟。

## 12. Lighthouse

2026 年 10 月 2 日对本地生产构建串行运行 Lighthouse 13.5。桌面 preset、移动默认模拟节流；测量期间未同时运行截图或功能测试。

| 类别           | Desktop |  Mobile |
| -------------- | ------: | ------: |
| Performance    |  **97** |  **92** |
| Accessibility  | **100** | **100** |
| Best Practices | **100** | **100** |
| SEO            | **100** | **100** |
| FCP            |  0.252s |  0.907s |
| LCP            |  0.977s |  3.410s |
| TBT            |   126ms |  23.5ms |
| CLS            |       0 |       0 |

两端均没有 runWarnings。满足 Desktop ≥95 / Mobile ≥90 和其余三项 100 的目标。v1.3 的归档成绩为 98 / 92；本次为 97 / 92，属于独立运行，不据此声明全面加速。以上不是 Vercel 域名的 Lighthouse 测量。

## 13. FPS

| 状态                 | Core 实际帧率 | 渲染器主线程样本 |
| -------------------- | ------------: | ---------------: |
| 可见空闲             |      19.98fps |        189.4ms/s |
| 项目交互             |      30.51fps |        235.3ms/s |
| 命令模式             |       9.99fps |        128.2ms/s |
| 离屏                 |       0.00fps |         56.3ms/s |
| 用户暂停             |       0.00fps |         42.3ms/s |
| 模拟隐藏             |       0.00fps |         31.3ms/s |
| 项目切页（包含卸载） |      12.11fps |        246.3ms/s |
| Quiet Mode           |       0.00fps |         35.0ms/s |
| 手机静态 Core        |       0.00fps |        161.2ms/s |

帧率以默认帧缓冲的真实 GL 呈现帧计数；排除透射与 PMREM 离屏清除。浏览器 RAF 不作为 Core 帧率。切页样本包含 Core 卸载后的零帧，因此不是持续运行上限。

## 14. WebKit 与视觉对照

Chromium 在 1920×1080、1440×900、1366×768、820×1180、390×844 共检查 35 个路由；WebKit 在桌面和手机检查 14 个路由。没有页面错误、shader 编译错误或横向溢出。WebKit 桌面明确强制 HIGH 能力提示，验证完整材质分支；手机为 LOW。

保存了 62 张标准 Chromium 截图、10 张 WebKit 截图、六个页面的 1440×900 升级前后对照和 Core 特写，以及 HIGH / MEDIUM / LOW、关闭内部 emissive 的检查图。人工检查了四个项目、Core、手机、终端、调色板与 WebKit 输出。原生 Safari 的 Apple 硬件尚未实测。

对照目录：`artifacts/v1.4/before/` 与 `artifacts/v1.4/after/`；共同包含首页、Vision、AirPocket、Swordsmith、Gomoku 和项目档案。截图及 JSON / HTML 性能记录留在本机的忽略目录，不上传到 Git 仓库或部署。

## 15. Build / lint / typecheck / tests

- `npm run lint`：通过，无警告。
- `npm run typecheck`：通过。
- `npm run build`：通过，保留全部路由及 13 个静态输出。
- `npm test`：**51 项通过**，含本次新增的 shader 编译、质量切换与手机材质交互检查。
- Terminal、Command Palette、GitHub 数据投影及恢复、Core 导航、项目浏览／返回、教学算法、焦点循环、移动菜单、Reduced Motion 均保持通过。
- 真实 GitHub 与生产部署的检查另在交付消息中记录，不以测试 mock 代替线上结果。

可重跑验证：

```powershell
npm run lint
npm run typecheck
npm run build
npm test
node scripts/material-captures.mjs http://localhost:3000 artifacts/v1.4/after
node scripts/material-resources.mjs http://localhost:3000 artifacts/v1.4
node scripts/visual-systems-qa.mjs http://localhost:3000 artifacts/v1.4
node scripts/visual-systems-performance.mjs artifacts/v1.4
node scripts/lighthouse-audit.mjs http://localhost:3000 artifacts/v1.4
```

## 16. 未采用的高成本效果

- 真实 Transmission、原生 Iridescence 和运行时 PMREM 环境预过滤：首轮完整方案桌面 Lighthouse 69、TBT 约 1355ms，且内部丝印偏糊。移除后采用解析反射；再加入异步预编译，最终回到 97 / 126ms。
- 大 HDR、4K / 8K 纹理、屏幕折射和色散：不值得为极小的展示面积增加加载与 pass。
- Bloom / SSAO / 实时接触阴影：本轮通过材质高光、真实倒角和局部近似接触阴影解决层次，未增加后期系统。
- 增加粒子、全局 Film Grain、Glitch、Chromatic Aberration、雨滴玻璃、镜头光斑、过度磨损：不符合精密设备与阅读目标。
- 新材质调试 UI：使用独立截图和资源探针调试，不在生产页面增加开发控件或虚构遥测。

本次所有几何、shader、SVG 与 CSS 都来自项目内代码；没有生成产品截图或改变任何项目事实。
