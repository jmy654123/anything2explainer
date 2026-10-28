# 五套画面风格 · 索引

> 五套风格是本 skill 的**定位本身**，不是可选插件。每套有独立的 8 槽规格（S1–S8），
> 令牌在 `template/src/styles.ts`，规格在同目录 `<n>-<id>.md`。

## 一句话分工

| n | id | 名称 | 一句话气质 | 出图 |
|---|---|---|---|---|
| 1 | `dashboard` | 未来科技数据大屏 | 近黑空区 + 右后方暗蓝环境光，磨砂玻璃卡落青色线稿 | 生图（1 背景 + N 物件） |
| 2 | `citation` | AI 搜索引用链路 | 靛蓝点阵上紫主体 + 青引线，看得见的理解链路 | 全代码 |
| 3 | `growth` | 企业增长故事 | 黄昏实拍打底，暖金配深蓝，投影分层不发光 | 免版权实拍 |
| 4 | `compare` | SEO 与 GEO 对比 | 浅底左右分屏，左蓝右紫，实描边 + 柔和投影 | 全代码 |
| 5 | `cards` | 极简动态图形 | 米白底粗色块，硬投影 8px，无圆角无发光 | 全代码 |

## 公共规则 vs 风格规则

**判据只有一条：换风格时这条规则要不要重写。**

| 层面 | 归属 | 位置 |
|---|---|---|
| 画布尺寸、帧号、时长换算、事实出处、示例语境 | 公共 | `../common-rules.md` |
| 构图与光的**结构**（主角 ≥170px、三档尺寸、空场判据、光跟主角） | 公共 | `../common-rules.md §5` |
| 动效帧数、曲线、错峰、离场、运镜预算 | 公共 | `../common-rules.md §8` |
| 安全区坐标、字幕 44px / top 637、HUD 位置 | 公共 | `../common-rules.md §9` |
| 镜头与节拍、衔接写法、章界、导航标签 | 公共 | `../common-rules.md §10–11` |
| 高光时刻的**公共上限**（每章 ≤1、扫光全片 ≤2） | 公共 | `../common-rules.md §6` |
| **色值、底色、幕底类型、字体与压窄、圆角与描边、光的形态、素材来源** | **风格** | `styles/<n>-<id>.md` S1–S7 |
| **高光时刻的类型**（sweep / bignumber / headline / split / symbol） | **风格** | `styles.ts` 的 `setPiece` |
| **红线**（本套禁止什么） | **风格** | `styles/<n>-<id>.md` S8 |

### 三条最容易搞混的

1. **「主角必带光」是公共的，「光是发光还是投影」是风格的。**
   第 4、5 套没有发光，但主角仍然必须有「光」——它们用彩色投影与硬投影承担同一个职责。禁止发光 ≠ 允许主角平摊在底色上。

2. **「字幕 44px / top 637」是公共的，「字幕什么颜色」是风格的。**
   任何套都不许动位置和字号；浅底两套必须反转成深字白边，否则是白字贴纸。

3. **「高光时刻每章 ≤1 个」是公共的，「高光时刻长什么样」是风格的。**
   第 1 套是象征物 + 光环 + 结论大字；第 2 套是三轮扫光（本套自收到 1 处）；第 3、5 套是断言大字；第 4 套是中线亮起 + 双侧对照。

## 8 槽速查（每套都要答完）

| 槽 | 内容 | 谁消费 |
|---|---|---|
| S1 底 | kind / canvas / backdrop / field / fieldEnd / titleGutter | `Main.tsx`、`Backdrop.tsx`、`frame_metrics.py` |
| S2 调色板 | primary 五档 / accent / neg / ok / line / text / dim / dimMid / grid / flash | `theme.ts` → `ui.tsx` / `fx.tsx` / `overlay` |
| S3 字体 | squeeze / headlineWeight / minPx / numFamily | `common/lib.tsx`、各图元 |
| S4 图元语法 | sw / radius / lightMode / fillMode | `ui.tsx` 的 `Box` / `Pill` / `TagBlock` |
| S5 光 | hero / heroS / accent / neg / text / bloom | `fx.tsx` 的 `HeroGlow` / `BigNumber` |
| S6 覆盖层 | hudFill / hudText / hudStroke / barFill / barTrack / subColor / subStroke / cardNum | `overlay/Overlay.tsx`、`ProgressBar`、`Subtitle` |
| S7 素材 | useImageGen / spec | 构建 agent 决定是否出图 |
| S8 红线 | setPiece + forbid[] | 派单打印 + QC 判据 |

## 选定方式

用户只看两个东西，其余不问：

1. **主题 → 画面风格**：`pickDefaultStyle(主题)` 给一套默认，同时把五套一起摆出来，用户选。
2. **声音风格**：`pickDefaultVoice(风格)` 给一只默认，同时把五只一起摆出来，用户选。

选定后写进 `config.style` / `config.voice`。**没写进 config 之前，不写分镜、不出图、不跑配音。**

## 预选顺序（命中即停）

| 顺序 | id | 主题里出现 |
|---|---|---|
| 1 | `compare` | 区别、对比、过时了吗、哪个好、选哪个、SEO 和 GEO |
| 2 | `cards` | 清单、日更、批量、一个知识点、三件事、逐项检查、几步 |
| 3 | `growth` | 获客、转化、案例、咨询、闭环、成交、复购 |
| 4 | `citation` | 引用、信源、知识库、被写进答案、被 AI 理解、内容结构 |
| 5 | `dashboard` | 排名、流量、关键词、收录、曝光、技术能力、数据大屏 |
| 无命中 | `dashboard` | 第 1 套语法最通用，且不会像浅底那样反转字幕与调色板 |

**注意**：主题提到「搜索」不等于大屏。信源、引用、知识库走 `citation`。

## 声音（与画面独立）

五只 edge 音色，`VOICE_FOR_STYLE` 只给预选，用户可以改成任意一只。换画面**不重跑配音**；换声音要重跑配音，口播词不变。