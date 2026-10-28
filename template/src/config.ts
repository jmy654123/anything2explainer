/**
 * 片子级配置。全片只有两个「用户选择」，都写在这里：
 *   1. `style` —— 画面风格（五套之一）。由主题预选（`styles.ts` 的 `pickDefaultStyle`），用户可改。
 *   2. `voice` —— 声音风格（五只之一）。独立选择，不由主题决定。
 *
 * 其余字段都是「按本片内容填」的：标题、章节、HUD 条目、流程轨。
 * 句 id（S01…）来自 `scripts/tts_build.py` 生成的 `timeline.ts`；章节数与标题来自 `narration.txt` 的 `# CHAPTER n 标题` 行。
 *
 * 注意：底色 / 幕底 / 调色板**不在这里**，由 `style` 决定（`styles.ts` → `theme.ts`）。早先版本还有一个
 * `bg` 字段与风格争同一个轴，已删除 —— 幕底现在读 `style` 那一套的 `base.backdrop`。
 */
import type {StyleId} from './styles';
import type {VoiceId} from './styles-voices';

export type HudEntry = {fromS: string; toS: string; text: string; tech?: string; fromOffset?: number; toOffset?: number; w?: number};
export type RailSpec = {steps: string[]; switchS: string[]; fromS: string; toS: string};
export const VIDEO = {
  slug: 'demo', // 素材目录 public/assets/<slug>/（配音 audio.wav 由 tts_build.py 写到这里）
  /**
   * 片子语言：'zh' 中文（默认）｜'en' 英文。
   * 影响 → 配音引擎（tts_build.py 的 TTS_ENGINE=auto 也会自己按解说词判语言）、标题/章节卡是否压窄（拉丁不压）、
   * 居中文字的基线补偿（CJK −2 / 拉丁 0）、文案与字幕块长度预算（见 reference/narration-storyboard.md §5）。
   */
  lang: 'zh' as 'zh' | 'en',

  // ==========================================================================
  // 选择点 1：画面风格（五套之一）
  // ==========================================================================
  /**
   * dashboard ｜ citation ｜ growth ｜ compare ｜ cards
   *
   * 由主题预选：`pickDefaultStyle(主题)`（`styles.ts`）。用户没意见就用预选的那套。
   * 写进这里之后，画布底色、幕底、调色板、字体压窄、图元语法、光、覆盖层皮肤、高光时刻类型
   * 全部跟着变 —— 这些值在 `styles.ts`，本文件不重复。
   *
   * **必须先问过用户再写**：占位不是许可。没写上之前不写分镜、不生成背景、不跑配音。
   */
  style: 'dashboard' as StyleId,

  // ==========================================================================
  // 选择点 2：声音风格（五只之一）
  // ==========================================================================
  /**
   * yunxi ｜ yunyang ｜ yunjian ｜ xiaoxiao ｜ xiaoyi
   *
   * **与画面风格独立**：`pickDefaultVoice(style)` 只给一个预选，用户可以选任意一只，
   * 不存在「选了某套画面就必须用某只声音」的绑定。配音时把对应 edge 音色传给 VOICE：
   * `VOICE=<voiceById(voice).edge> python3 scripts/tts_build.py`
   */
  voice: 'yunyang' as VoiceId,

  /**
   * 片头。中文片：big 用 Audiowide 宽体（缩写/英文词），rest 用 Noto 900（中文部分），en 是英文全称，tagline 一句话钩子。
   * 英文片：rest 留空 ''（不显示），big 放主词/缩写，en 放全称或副标，tagline 一句话钩子。
   */
  title: {big: 'TOPIC', rest: '主题名', en: 'Full Name of the Topic', tagline: '一句话钩子'},
  // 中英不要并排等大：big 与 rest 是"宽体缩写 + 中文词"（118 / 96px，字号差要看得出）；两个都是长词时只留一个，另一种语言落到 tagline。
  /** 片尾署名卡（内容压黑 + 末句字幕结束后 ≈2 s，aboveBar；不需要就设为 null）。
   *  例：{kicker: 'BASED ON', title: '<论文 / 书 / 报告标题>', byline: '<作者 · 出处 · 年份>', note: 'all visuals drawn in code'} */
  credit: null as {kicker: string; title: string; byline: string; note: string} | null,
  /** 片尾署名行（默认开）：有署名卡时排在卡下方，没有署名卡时单独居中。不要就设为 ''。 */
  builtBy: 'built by Anything2Explainer skill',
  /** 章节英文副标（顺序对应 narration 的 CHAPTER 1..n；章节卡从第 2 章起显示；英文片可留空 '' 不渲染）。
   *  和章名一样是「说清讲什么」的标签，不是第二个创意标题；写这章的英文关键词或步骤序列（`Build · Run · Trace`）。 */
  chapterTech: ['Chapter One', 'Chapter Two'],
  /** 顶部 HUD 胶囊（当前小节名）：按句 id 区间；相邻条目之间自动无空档；跨章节卡自动淡出。下面两条对应模板 narration.txt 的两句，按本片重写。
   *  text 是导航标签：写「这一小节讲什么」的名词短语（`知识库构建` / `混合检索`），不要评价句或比喻（`感觉还行` / `两把尺子` 观众猜不出内容）。
   *  tech 是胶囊下面那行英文副标（灰色 22px 小字，`TechSub`）：只放真正需要露出的英文术语，中文能说清就别加——它是注脚，不是第二个标题。 */
  hud: [
    {fromS: 'S01', toS: 'S01', text: '第一节名'},
    {fromS: 'S02', toS: 'S02', text: '第二节名', tech: 'Optional English'},
  ] as HudEntry[],
  /** 流程轨（可选，只给真有先后顺序步骤的章；一章最多一条，五步以内）：y118–162，当前步主色、已过灰底、未到灰边；有轨的章内容主区 y175–620。
   *  例：{steps: ['第一步', '第二步', '第三步'], switchS: ['S12', 'S14', 'S16'], fromS: 'S12', toS: 'S18'} */
  rails: [] as RailSpec[],
  /** 片头帧数（tts_build 的 LEAD+CHAPTER_GAP 决定，通常 85）与片尾压黑 */
  endingFade: 30,
};