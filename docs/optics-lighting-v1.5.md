# MARCELL.OS v1.5.0 · OPTICS & PERCEPTUAL LIGHTING PASS

本轮沿用 v1.4 材质、v1.3 交互与现有信息架构，提升镜头、反射形状、空间衰减和表面之间的关系。没有新增业务功能、项目、产品截图、遥测数字或大型资源。项目案例、GitHub 服务、教学算法、终端命令、键盘导航、SEO 和原有路由保留。

## 审计与新增文件

v1.4 Camera 为 FOV 45°、位置 `[0,0,6.6]`，near/far 沿用 Three 默认值；没有手机 WebGL 镜头，手机与 reduced motion 使用静态 Core。原有指针响应主要来自 Core 旋转，反射为三个圆形方向 lobe，前后轨道使用相同透明度；三个独立信号球体没有尾部。玻璃不写深度，但线路和粒子的透明材质仍会写深度。原版没有可见的材质调试面板，本轮同时补齐 `debugMaterials` 和 `debugLighting`。

新增 `lib/optics.ts`、`lib/materials/shaders/depth.ts`、`lib/materials/shaders/legacy-studio.ts`、`components/three/optics-debug.tsx`、`app/styles/optics.css`，以及开发 QA、对照生成脚本和两项 v1.5 行为测试。既有 Core、MaterialRenderer、材质库、Studio / Glass / Contact shaders、ProjectVisual、VisualEnvironment、CursorGlow 和版本数据相应更新。

## 1. Camera 调整

显式 near=0.1、far=24，视线目标 `[0,0,0]`。默认位置 `[0,0,7.511]`，保持原 Hero 位置与负空间。镜头指针偏移上限为每轴 0.018 世界单位；Core 保留更明显的既有旋转响应；环境背景反向移动，HUD 沿用很小的反向乘数。没有自由旋转、镜头摇晃或布局移动。

## 2. FOV 与焦段感

实际拍摄并比较 35/40/45/50°，分别匹配距离 8.671/7.511/6.600/5.863。用 `6.6 × tan(22.5°) / tan(FOV/2)` 匹配投影大小，使比较集中在透视压缩而非放大。

最终采用 40°，略收紧透视，保持现有装置层次；35° 更压缩，50° 前后比例变化较明显。Core / Project focus 只改变相机距离 0.8%，平滑收敛。调试固定姿态会禁用此呼吸与指针偏移。

## 3. Depth cues

轨道 shader 依据 view-space 距离降低后侧透明度、降低对比并轻微偏蓝灰。高质量表面反射增加距离响应，远处高光降低；轻量 haze 只影响 3D 表面，不叠加雾体。Core / Project focus 下装饰网格与环境亮度降低，正文保持清晰。

OVERVIEW、CORE_FOCUS、PROJECT_FOCUS、COMMAND_FOCUS、LAB_FOCUS 作为统一焦点状态。Command / Terminal 沿用降帧与装饰压低；Lab / Project 路由只调整环境状态，没有新布局。

## 4. 金属高光

继续使用 v1.4 阳极氧化底色、粗糙度、倒角和 High anisotropy。反射由实际 view vector 与 normal 得出，响应棚灯方向；高光随指针改变观察角度滑动，而非提高金属 emissive。局部微粗糙度拆散反射，保持静态、极低幅度，不增加可见噪点。

## 5. Glass optical response

保留 Schlick Fresnel、IOR 1.45 与厚度吸收近似。加入窄而柔的 softbox 响应、弱的第二界面偏移、内部光的局部反射；玻璃正面仍暗且低透明度，斜面更明显。透明度上限 0.26，没有白色描边、true transmission、折射屏幕拷贝或色差。

前表面位于 z=0.53，蚀刻在 z=0.572；内部处理器、线路与 PCB 保持实体深度。透明玻璃 renderOrder=1，蚀刻=2，信号仍 depthTest=true、depthWrite=false；内部实体正常遮挡线路和脉冲。

## 6. PCB / Ceramic

PCB 保留粗糙度 0.86 与很弱反射，仅在合适观察方向获得少量 solder-mask 光泽。陶瓷保留粗糙度 0.66 和低金属度，获得宽、低强度顶光；石墨保留更暗且更粗糙的响应。板、外壳、陶瓷和背景没有合并成同一级黑。

## 7. Studio reflection

由三个圆形方向高光改为共享的 TOP SOFTBOX / LEFT STRIP / RIGHT RIM。通过切向和副切向宽度形成面积灯形状，粗糙表面获得更宽反射。Key=2.35、Fill=0.5、Rim=0.24，紫色 Rim 从 0.65 降低；半球光从 0.8 降为 0.6，保留暗侧和 lost edges。

继续 ACESFilmicToneMapping、曝光 1、sRGB 输出，没有 LUT、整站增亮或纯白闪光。

## 8. Fake GI / bounce light

内部灯位于 Core 的 `[0,0,0.41]`，基础强度 0.36、范围 1.5、decay=2；激活时仅增加 25%。共享 shader 使用真实 world-space 表面位置与内部源位置，按 `1/(1+18×distance²)` 衰减，结合面朝向与材质 specular response。Vision 冷蓝、AirPocket 青色、Swordsmith 暖琥珀、Gomoku 蓝白只作用于局部线路、玻璃和反射。没有实际 GI 渲染。

## 9. Contact Shadow

板与框架、die 与板使用同一个 shader program 的不同接触间距参数。小间距阴影更窄且更深；较远间距更宽、更柔。仅作用于接触边缘，不把整块表面压黑，不增加 ShadowMap、SSAO 或额外 render pass。

## 10. Project-specific lighting

| 项目                | 实施变化                                                                                                              |
| ------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Vision Navigation   | 传感器玻璃窄反射、前后光学边缘、一次 700ms exposure resolve，再沿用 detection pipeline。仍标注 SYSTEM VISUALIZATION。 |
| AirPocket           | 薄透明前层、弱后侧路线与前侧节点对比；没有厚重硬件材质。                                                              |
| Swordsmith Notebook | 左侧与上侧暖色 found edge，右侧保持暗，暖色落在边缘与局部表面。                                                       |
| Gomoku AI           | 棋子保留陶瓷／石墨渐变，增加弱接触阴影与板顶光；选中候选保留技术蓝。仍是 Minimax 示意，没有神经网络暗示。             |

DOM 卡片使用低透明度、狭长 softbox 随指针缓慢移动；玻璃增强顶边，实体金属调整定向边缘和表面对比。使用渐变与注册 CSS 属性，不增加 backdrop-filter。按钮仅增加很弱的顶部 highlight。

## 11. Signal optics

DATA / CONTROL / STATUS 的空闲持续时间分别为 1.65 / 1.82 / 2.02 秒，激活时略加速。仍采用稀疏调度。每条信号包含中心点和两段变小、变暗的尾部，亮点采用视角相关的中心响应；9 个实例共用一个绘制批次，替代原来三个独立球体。

透明线路、粒子、轨道、信号均不写深度；信号正常深度测试，实体 frame / die / PCB 可遮挡，前玻璃再叠加弱吸收。没有全局 Bloom，也没有一直置顶的 additive 信号。

## 12. Material LOD

根据 viewport 高度、Camera FOV 与距离计算每个世界单位的投影像素数，在 65–115px 区间 smoothstep。与单独使用距离相比，匹配相同投影尺寸的四种 FOV 保持相同 LOD，避免误关仍可见的细节。

High 微法线与微粗糙度随 materialDetailLevel 渐变；极小投影尺寸跳过细节分支。Medium 不计算微法线导数。小丝印和蚀刻强度渐变，主品牌标识保持可读。没有几何切换或突然弹出。

## 13. High / Medium / Low

| 质量   | 光学响应                                                  | DPR / 调度                                               |
| ------ | --------------------------------------------------------- | -------------------------------------------------------- |
| High   | 面积反射、微表面、完整空间衰减、局部 bounce、信号光学     | 上限 1.5；Idle 20Hz、激活约30Hz、Command / Terminal 10Hz |
| Medium | 反射强度 0.65、较弱 haze / bounce、无微法线导数、较少粒子 | 上限1.25；Idle / Hover 20Hz、Command / Terminal 10Hz     |
| Low    | CSS / SVG 静态构图、工程边缘、静态反射渐变                | 不创建 Core WebGL                                        |

CSS fallback 从 SSR 开始可见。Shader 异步预编译期间保留 fallback；编译完成后呈现基础材质，微表面与光学响应沿现有 demand 渲染渐进收敛。预编译全部必要 programs，没有额外网络资源或阻塞正文的加载时间。

## 14. Mobile / Reduced Motion

≤760px 继续 Low 静态 Core，保留原有项目按钮与内容。静态芯片增加窄反射与不同明暗边缘，轨道／PCB 的构图保持。Reduced motion 同样使用静态材质提示，不创建 Core Canvas；禁用镜头呼吸、parallax、signal travel、focus movement 和 sensor exposure。

## 15. Draw Calls / 资源预算

High 空闲 29.00、交互 28.78、Command / Terminal 28.00 次/帧；Medium 空闲 28.64、交互 28.69。保留 28–29 次/帧，低于目标 32；离屏额外渲染 pass 为 0。脉冲点与尾部共用实例批次，没有额外 Canvas 或后处理缓冲。

GL 对象探针测得 High 与 Medium 均为 7 textures、112 buffers、15 programs、3 framebuffers，与 v1.4 的记录相同。连续 12 次项目 hover、High→Low→Medium→Low→High 后数量未增长；切到手机或项目路由，旧 context 标记 lost，资源释放。程序化标签仍只有两张 512×512 贴图。

这些是资源对象和生命周期检查，不等于 GPU 内存字节。浏览器没有提供可靠的绝对硬件内存计数，本轮没有报告虚构的 MB 数字。

## 16. FPS / idle 成本

| 状态            | High Core FPS | Medium Core FPS |
| --------------- | ------------: | --------------: |
| Idle            |         19.96 |           19.98 |
| Project hover   |         29.93 |           19.99 |
| Terminal        |          9.99 |           10.00 |
| Command Palette |         10.00 |            9.99 |
| Mobile          |             0 |               0 |

离屏、暂停、模拟 hidden-tab、Quiet Mode 稳定状态均为 0 Core FPS。项目交接采样窗口内平均为 12.13 FPS，包含 Core 卸载后零帧阶段，不是设备最大 FPS；真实原生 ViewTransition 观察到一次，项目图共享交接也观察到一次。

稳定 Quiet Mode 主线程 TaskDuration 为 38.3ms/s，包含页面时钟和测试采样，Core 不继续绘制。High Idle / Hover 分别为 312.7 / 316.2ms/s，Medium 为 222.4 / 250.9ms/s。不同采样轮主线程数据有明显波动；不能据此声称总体 CPU 或真实 GPU 用量下降。Chromium headless 可能使用软件渲染。浏览器 RAF 接近主机刷新率，不作为 Core FPS；Core FPS 只统计默认帧缓冲呈现帧。

## 17. Lighthouse

Lighthouse 13.5.0 对本地最终 production build 单独测量；未与测试或截图并行。v1.4 使用本轮重启的原生产构建，v1.5 使用最后完成的生产构建。

| 项目           | v1.4 Desktop | v1.5 Desktop | v1.4 Mobile | v1.5 Mobile |
| -------------- | -----------: | -----------: | ----------: | ----------: |
| Performance    |           98 |           99 |          92 |          91 |
| Accessibility  |          100 |          100 |         100 |         100 |
| Best Practices |          100 |          100 |         100 |         100 |
| SEO            |          100 |          100 |         100 |         100 |
| FCP ms         |        244.4 |        250.7 |       905.0 |       908.8 |
| LCP ms         |        943.0 |        964.7 |      3378.0 |      3451.6 |
| TBT ms         |         83.0 |         27.5 |         9.0 |        42.0 |
| CLS            |            0 |            0 |           0 |           0 |

最终无 Lighthouse warnings。此前 v1.5 两轮分别为 99 / 93、98 / 92；最终采用最新构建的最近一次 99 / 91，不挑最高分。各轮均达到 Desktop≥96、Mobile≥90。最终相对同机基线桌面 +1 分、手机 −1 分，没有超过 2 分的退步。结果来自本地 production 构建，不等同于 Vercel 网络条件下的分数。

## 18. Chromium / WebKit / 视觉 QA

Chromium：1920×1080、1440×900、1366×768、820×1180、390×844，35 次路由检查、62 张常规截图，全部 HTTP 200、无横向溢出、无 page / shader errors。包含 Terminal、Palette、Memory、Pathfinding、Converter、CPU 与 reduced motion。

Playwright WebKit：桌面 High、手机 Low、1366px Medium、桌面 reduced motion，共 18 次路由检查。正常路径真实 v1.5 optics shaders 编译成功，没有靠恢复模式掩盖失败；项目图、导航、命令面板和尺寸检查通过。WebKit 截图共 12 张。没有在 Apple 硬件上实测原生 Safari，测试范围是 WebKit 引擎。

另有 17 张开发镜头／灯光／材质／grayscale／去 HUD／恢复截图。去 HUD 后，Core 依然由金属框、PCB、玻璃前层、陶瓷 die 和前后轨道形成层次；grayscale 用 CSS 临时施加，仅用于 QA。实际缩小 Canvas 高度至 240 / 420 / 654px，LOD 分别为 0 / 0.14 / 1，验证了中间渐变。

七组前后对照包含 14 张完整加载图片。滑块、方向键、图片直接 pointer drag 均验证通过，保留可访问标签。截图与统计位于 `artifacts/v1.5/`。

## 19. lint / typecheck / build / tests

`npm run lint`、`npm run typecheck`、`npm run build` 全部通过，原有 13 个静态输出与动态路由保持。`npm run test`：53/53 通过。

验证覆盖项目、GitHub 正常／失联／限流状态、Terminal v2、fuzzy command palette、Core 导航、键盘与焦点、sorting、pathfinding、64-bit binary、memory、CPU、手机、reduced motion、质量恢复和生产调试参数隔离。

初轮测试暴露 native shortcut 的 hydration 等待问题与未限定活动区域的定位；补齐既有 live-clock 等待，并把 VisionStory 的观察范围限定在当前 case-study grid，避免流式加载暂存副本参与阶段计算。最终全套通过，没有删掉检查或放宽结果断言。

## 20. 有意没有采用的效果

没有 true transmission、PMREM / HDR、SSAO、global bloom、真实 volumetrics、实时软阴影、重型 DOF、bokeh、大型纹理／视频／环境图。没有镜头光斑、摇晃、电影黑边、雨、碎片或全局色差。没有独立 halo billboard：中心与尾部已经提供足够衰减，额外透明 draw 会降低遮挡清晰度。环境 focus 只改变对比，未增加大面积 blur。亚像素色散对实际可读性收益很低，也未采用。

## 调试与恢复

只有开发环境响应 `?debugMaterials=1` / `?debugLighting=1`。面板可查看实际 Camera 位置、FOV、质量、焦点、LOD、光学收敛阶段与灯光参数，支持灯光和材质 solo。生产不加载调试组件，且忽略 `shaderFault` 参数。

`MaterialRenderer` 在异步编译后检查真实 GL LINK_STATUS；失败即恢复 v1.4 主材质 shaders。恢复仍失败时继续显示静态 Core。开发 QA 实际注入一次语法错误，记录失败链接并验证恢复后的项目导航，正常路径没有 shader / page errors。

## 截图与版本历史

`artifacts/v1.5/before/` 为本轮重拍的 v1.4 生产构建，`after/` 为 v1.5。完整页面 1440×900，默认观察方向相同，项目示意图统一为完整状态。摄影视角参数的变更属于本轮改动；时钟、轨道微量相位和实时数据可能不同。

`scripts/optics-comparison.mjs` 生成 `artifacts/v1.5/comparison.html`，含首页、Core 局部、四个项目和项目档案共七组图片。可在图片上直接拖动，也支持独立滑块和方向键。截图、测试缓存与本地认证均忽略提交；报告和复现脚本提交 GitHub，历史报告保留。
