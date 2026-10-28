/**
 * 五套画面风格 —— 每套 8 槽（S1–S8），全部被代码真实消费。
 *
 * 这份文件是**唯一的视觉真相源**：`ui.tsx` / `fx.tsx` / `Main.tsx` / `overlay` / `common/ProgressBar` /
 * `common/Subtitle` 都从这里派生色值与语法；`config.ts` 的 `style` 决定取哪一套。
 * 改这里 = 改全片长相；改 `config.style` = 换一套。
 *
 * 五套的规格文档在 `reference/styles/<n>-<id>.md`，本文只放被代码读的令牌。
 * 确认点只有一个：`pickDefaultStyle(主题)` 预选一套，把五套一起给用户，选定后写进 `config.style`。
 */
export type {VoiceId} from './styles-voices';
export {VOICES, voiceById, pickDefaultVoice, type VoiceStyle} from './styles-voices';

export type StyleId = 'dashboard' | 'citation' | 'growth' | 'compare' | 'cards';

/** S1 底：画布底色、环境光、幕底方案。浅底三套必须同时反转字幕与调色板语义。 */
export type BaseTokens = {
  /** 底色类型决定量化脚本怎么抠背景：near-black / indigo 用点阵 mask，footage、light-* 不用。 */
  kind: 'near-black' | 'indigo' | 'footage' | 'light-split' | 'light-paper';
  /** 画布最底层不透明底色（Main.tsx 的 background） */
  canvas: string;
  /** 幕底：点阵波（dots）｜星点雾底（stars）｜纯色渐变（gradient）｜实拍（footage） */
  backdrop: 'dots' | 'stars' | 'gradient' | 'footage';
  /** 点阵/星点颜色；backdrop 非 dots/stars 时忽略 */
  dot?: string;
  /** 点阵或雾底自身底色（frame_metrics 按它抬柔光下限）；backdrop 为 gradient 时是渐变起点 */
  field?: string;
  /** 雾底/渐变末端色 */
  fieldEnd?: string;
  /** 左侧是否保留纯空区给标题（本套版式前提：标题进左空区，只有第 1 套用） */
  titleGutter: boolean;
};

/** S2 调色板：角色→色值。语义固定，色相每套各定；镜头只准引用角色名，不准写字面色值。 */
export type RoleTokens = {
  /** 当前重点 / 品牌 / 激活 */
  primary: string;
  primaryLight: string;
  primaryDeep: string;
  /** 英文技术词 */
  primaryTech: string;
  primaryPale: string;
  /** 第二重点 / 「另一方」/ 指标数字 */
  accent: string;
  /** 警示 / 被否定 / 幻觉这类负面 */
  neg: string;
  /** 正确 / 勾 */
  ok: string;
  /** 结构线（描边、箭头、网格） */
  line: string;
  /** 正文 */
  text: string;
  /** 次要文字 */
  dim: string;
  /** 更暗的结构填充（灰块） */
  dimMid: string;
  /** 网格线 */
  grid: string;
  /** 事件闪（白闪） */
  flash: string;
};

/** S3 字体：压窄系数、字重、最小字号。浅底不压窄（可读性优先）。 */
export type TypeTokens = {
  /** 中文标题压窄系数；英文片恒为 1 */
  squeeze: number;
  headlineWeight: number;
  minPx: number;
  /** 数字是否上 Orbitron 宽体（科技感题材用；商务/极简套不用） */
  numFamily: 'orb' | 'cjk';
};

/** S4 图元语法：描边宽度、圆角、光的类型（发光 / 投影 / 无）。 */
export type ShapeTokens = {
  sw: number;
  radius: number;
  lightMode: 'glow' | 'shadow' | 'none';
  fillMode: 'outline' | 'solid' | 'glass';
};

/** S5 光：三档层次的具体色值（结构底光 / 重点光 / 事件闪）。 */
export type LightTokens = {
  /** 主角常亮：双层柔光 */
  hero: string;
  /** 当前重点：小面积柔光 */
  heroS: string;
  /** 第二重点的光 */
  accent: string;
  /** 警示的光 */
  neg: string;
  /** 大字白光 */
  text: string;
  /** 结构线 bloom */
  bloom: string;
};

/** S6 覆盖层皮肤：HUD、进度条、字幕。浅底三套必须改字幕配色，否则白字黑边贴纸感。 */
export type OverlayTokens = {
  hudFill: string;
  hudText: string;
  hudStroke: string;
  /** 进度条已播 */
  barFill: string;
  /** 进度条未播 */
  barTrack: string;
  /** 字幕文字 */
  subColor: string;
  /** 字幕描边 */
  subStroke: string;
  /** 章节卡序号 */
  cardNum: string;
};

/** S7 素材：能否生图、走哪份出图规范。 */
export type AssetTokens = {
  /** 是否启用生图（plate / 物件）；false 时全部代码绘制 */
  useImageGen: boolean;
  /** 出图规范文件名（reference/styles/ 下）；null = 不适用 */
  spec: string | null;
};

/** 高光时刻的本套替代编排（浅底不能扫光，否则变白噪）。 */
export type SetPieceKind = 'sweep' | 'bignumber' | 'headline' | 'split' | 'symbol';

export type StyleTokens = {
  id: StyleId;
  /** 给用户看的编号 1–5 */
  n: 1 | 2 | 3 | 4 | 5;
  name: string;
  /** 一句话气质（给用户看，不含技术参数） */
  look: string;
  /** 适配：什么主题用这套 */
  fit: string;

  /** S1 */ base: BaseTokens;
  /** S2 */ role: RoleTokens;
  /** S3 */ type: TypeTokens;
  /** S4 */ shape: ShapeTokens;
  /** S5 */ light: LightTokens;
  /** S6 */ overlay: OverlayTokens;
  /** S7 */ assets: AssetTokens;
  /** S8 */ setPiece: SetPieceKind;
  /** S8 红线：打印进构建 agent 的派单，同时给 QC 当判据 */
  forbid: string[];
};

export const STYLES: StyleTokens[] = [
  // =========================================================================
  // 1 未来科技数据大屏 —— 配色来自 reference/styles/01-dashboard.md 的实测值
  // =========================================================================
  {
    id: 'dashboard',
    n: 1,
    name: '未来科技数据大屏',
    look: '近黑空区 + 右侧暗蓝环境光，磨砂玻璃卡上落青色线稿物件。科技感、专业感，光只有一处、在右后方。',
    fit: '搜索优化服务、技术能力展示、GEO 方法论；主题在讲排名、流量、关键词、收录、信源、引用、知识库、怎样被 AI 理解。默认套。',
    base: {
      kind: 'near-black',
      canvas: '#010511',
      backdrop: 'gradient',
      dot: '#1B2A3A',
      field: '#010511',
      fieldEnd: '#0A1520',
      titleGutter: true,
    },
    role: {
      primary: '#54B9D5', // 青：图标、小标、当前重点（实测值）
      primaryLight: '#7FD4E8',
      primaryDeep: '#2E7F94',
      primaryTech: '#54B9D5',
      primaryPale: '#D6EFF6',
      accent: '#3B82F6', // 电光蓝：指标、第二重点
      neg: '#C47D84', // 灰红：否定（要灰，不要鲜红）
      ok: '#4ADE80',
      line: '#F4F4F5',
      text: '#F4F4F5',
      dim: '#8A93A0',
      dimMid: '#243040',
      grid: '#1E2A38',
      flash: '#FFFFFF',
    },
    type: {squeeze: 1, headlineWeight: 900, minPx: 22, numFamily: 'orb'},
    shape: {sw: 2, radius: 8, lightMode: 'glow', fillMode: 'glass'},
    light: {
      hero: '0 0 12px 3px rgba(84,185,213,.30), 0 0 42px 14px rgba(84,185,213,.38)',
      heroS: '0 0 24px 8px rgba(84,185,213,.55)',
      accent: '0 0 40px rgba(59,130,246,.70), 0 0 100px 10px rgba(59,130,246,.22)',
      neg: '0 0 60px 20px rgba(196,125,132,.35), 0 0 20px 6px rgba(196,125,132,.40)',
      text: '0 0 12px rgba(255,255,255,.50), 0 0 4px rgba(255,255,255,.32)',
      bloom: 'drop-shadow(0 0 3px rgba(255,255,255,0.45))',
    },
    overlay: {
      hudFill: 'rgba(10,21,32,.72)',
      hudText: '#EAF6FA',
      hudStroke: 'rgba(84,185,213,.60)',
      barFill: 'rgba(84,185,213,.52)',
      barTrack: 'rgba(244,244,245,.26)',
      subColor: '#F4F4F5',
      subStroke: '#010511',
      cardNum: '#54B9D5',
    },
    assets: {useImageGen: true, spec: '01-dashboard.md'},
    setPiece: 'symbol',
    forbid: [
      '禁止出现紫色（本套主色是青 #54B9D5，紫色不在调色板里）',
      '禁止鲜红；否定只用灰红 #C47D84 且只盖被否定的那一个词',
      '禁止把整张意思底图交给生图模型（它会自己画槽位和中文）；只出「1 张虚化背景 + 每个意思 1 件青线物件」',
      '禁止在左侧空区放卡片或图形（空区只放标题，亮度低于 20）',
      '禁止一侧两盏以上的光；光只有一处，在右后方',
      '禁止全片出现第四种颜色角色（空区 / 环境光 / 玻璃 / 字与线）',
    ],
  },

  // =========================================================================
  // 2 AI 搜索引用链路
  // =========================================================================
  {
    id: 'citation',
    n: 2,
    name: 'AI 搜索引用链路',
    look: '靛蓝底上一条看得见的理解链路：中央 AI 回答界面连着网页、文档和引用，紫为主、青走引线。',
    fit: '内容结构优化、品牌知识建设、GEO 机制；主题在讲信源、引用、知识库、被写进答案的路径。',
    base: {
      kind: 'indigo',
      canvas: '#0D0B1F',
      backdrop: 'dots',
      dot: '#3B3470',
      field: '#0D0B1F',
      fieldEnd: '#1B1440',
      titleGutter: false,
    },
    role: {
      primary: '#8B5CF6',
      primaryLight: '#B49BFF',
      primaryDeep: '#5B21B6',
      primaryTech: '#A78BFA',
      primaryPale: '#E9E3FF',
      accent: '#22D3EE', // 青：引线与链路专用
      neg: '#F43F5E',
      ok: '#34D399',
      line: '#CBD5E1',
      text: '#F1F5F9',
      dim: '#6B7280',
      dimMid: '#2A2440',
      grid: '#2E2850',
      flash: '#FFFFFF',
    },
    type: {squeeze: 1, headlineWeight: 900, minPx: 22, numFamily: 'orb'},
    shape: {sw: 2, radius: 12, lightMode: 'glow', fillMode: 'glass'},
    light: {
      hero: '0 0 12px 3px rgba(139,92,246,.35), 0 0 42px 14px rgba(139,92,246,.45)',
      heroS: '0 0 24px 8px rgba(139,92,246,.60)',
      accent: '0 0 40px rgba(34,211,238,.65), 0 0 100px 10px rgba(34,211,238,.22)',
      neg: '0 0 60px 20px rgba(244,63,94,.40), 0 0 20px 6px rgba(244,63,94,.45)',
      text: '0 0 12px rgba(255,255,255,.55), 0 0 4px rgba(255,255,255,.35)',
      bloom: 'drop-shadow(0 0 3px rgba(255,255,255,0.5))',
    },
    overlay: {
      hudFill: 'rgba(27,20,64,.78)',
      hudText: '#F1F5F9',
      hudStroke: 'rgba(139,92,246,.55)',
      barFill: 'rgba(167,139,250,.52)',
      barTrack: 'rgba(241,245,249,.28)',
      subColor: '#F1F5F9',
      subStroke: '#0D0B1F',
      cardNum: '#A78BFA',
    },
    assets: {useImageGen: false, spec: null},
    setPiece: 'sweep',
    forbid: [
      '禁止把紫色撒在配角上（一帧紫光只给当前重点一处）',
      '禁止用实色板冒充玻璃卡（必须能看见卡片后面的虚化背景）',
      '禁止鲜红；负面（幻觉 / 不可信）用玫红 #F43F5E 且带双层柔光',
      '禁止扫光超过 1 处（全片核心概念登场 1 次为上限）',
    ],
  },

  // =========================================================================
  // 3 企业增长故事
  // =========================================================================
  {
    id: 'growth',
    n: 3,
    name: '企业增长故事',
    look: '黄昏城市与办公室实拍打底，暖金配深蓝；分析图形只作点缀，不铺满发光特效。',
    fit: 'B2B 品牌、解决方案、客户案例；主题在讲获客、转化、从曝光到咨询。增长数字只用有出处的数。',
    base: {
      kind: 'footage',
      canvas: '#0B1426',
      backdrop: 'footage',
      field: '#0B1426',
      fieldEnd: '#122036',
      titleGutter: false,
    },
    role: {
      primary: '#F5B544', // 暖金
      primaryLight: '#FFD07A',
      primaryDeep: '#B4771F',
      primaryTech: '#F5B544',
      primaryPale: '#FFF2DC',
      accent: '#3B82F6', // 深蓝
      neg: '#DC2626',
      ok: '#22C55E',
      line: 'rgba(255,255,255,.60)',
      text: '#FFFFFF',
      dim: '#9CA3AF',
      dimMid: 'rgba(255,255,255,.12)',
      grid: 'rgba(255,255,255,.18)',
      flash: '#FFFFFF',
    },
    type: {squeeze: 1, headlineWeight: 900, minPx: 24, numFamily: 'cjk'}, // 不用 Orbitron，避免科技感破坏商务调性
    shape: {sw: 2, radius: 4, lightMode: 'shadow', fillMode: 'outline'},
    light: {
      hero: '0 0 16px 4px rgba(245,181,68,.28), 0 0 48px 16px rgba(245,181,68,.32)',
      heroS: '0 0 26px 10px rgba(245,181,68,.50)',
      accent: '0 0 40px rgba(59,130,246,.55), 0 0 100px 10px rgba(59,130,246,.18)',
      neg: '0 0 50px 16px rgba(220,38,38,.35)',
      text: '0 0 10px rgba(255,255,255,.40)',
      bloom: 'drop-shadow(0 2px 6px rgba(0,0,0,.55))', // 实拍上靠投影分层，不靠发光
    },
    overlay: {
      hudFill: 'rgba(11,20,38,.62)',
      hudText: '#FFFFFF',
      hudStroke: 'rgba(245,181,68,.55)',
      barFill: 'rgba(245,181,68,.55)',
      barTrack: 'rgba(255,255,255,.22)',
      subColor: '#FFFFFF',
      subStroke: '#0B1426',
      cardNum: '#F5B544',
    },
    assets: {useImageGen: false, spec: null},
    setPiece: 'headline',
    forbid: [
      '禁止满屏发光特效（本套靠实拍氛围 + 投影分层）',
      '禁止紫色',
      '禁止用 Orbitron 等宽体科技字做数字（用 Noto，与商务调性一致）',
      '禁止虚构增长曲线暗示真实业绩；数据必须有出处或标「示意」',
      '实拍素材只能用免版权素材并登记 MANIFEST；禁止使用任何现有视频的帧',
    ],
  },

  // =========================================================================
  // 4 SEO 与 GEO 对比
  // =========================================================================
  {
    id: 'compare',
    n: 4,
    name: 'SEO 与 GEO 对比',
    look: '左右分屏，白与浅灰底，左蓝右紫各管一侧；实描边 + 柔和投影，不用发光。',
    fit: '解释概念、纠正误区、系列栏目；主题在讲两种做法的区别、怎么一起布局。',
    base: {
      kind: 'light-split',
      canvas: '#FFFFFF',
      backdrop: 'gradient',
      field: '#FFFFFF',
      fieldEnd: '#F3F0FF',
      titleGutter: false,
    },
    role: {
      primary: '#1D4ED8', // 左/甲侧
      primaryLight: '#3B82F6',
      primaryDeep: '#1E3A8A',
      primaryTech: '#1D4ED8',
      primaryPale: '#DBEAFE',
      accent: '#7C3AED', // 右/乙侧
      neg: '#DC2626',
      ok: '#16A34A',
      line: '#0F172A',
      text: '#0F172A',
      dim: '#64748B',
      dimMid: '#E2E8F0',
      grid: '#CBD5E1',
      flash: '#FFFFFF',
    },
    type: {squeeze: 1, headlineWeight: 800, minPx: 24, numFamily: 'cjk'},
    shape: {sw: 2, radius: 6, lightMode: 'shadow', fillMode: 'outline'},
    light: {
      hero: '0 8px 24px rgba(15,23,42,.14), 0 2px 6px rgba(15,23,42,.10)',
      heroS: '0 4px 16px rgba(29,78,216,.24)',
      accent: '0 4px 16px rgba(124,58,237,.24)',
      neg: '0 4px 14px rgba(220,38,38,.22)',
      text: 'none',
      bloom: 'none',
    },
    overlay: {
      hudFill: 'rgba(255,255,255,.92)',
      hudText: '#1D4ED8',
      hudStroke: 'rgba(15,23,42,.16)',
      barFill: 'rgba(29,78,216,.45)',
      barTrack: 'rgba(15,23,42,.12)',
      subColor: '#0F172A',
      subStroke: '#FFFFFF', // 浅底反转：深字白边
      cardNum: '#1D4ED8',
    },
    assets: {useImageGen: false, spec: null},
    setPiece: 'split',
    forbid: [
      '禁止发光与柔光（本套用投影，一有 glow 就变成科技片）',
      '禁止白字（浅底上不可读）',
      '禁止左右两侧混用同一种色（左蓝右紫是语义，不能互换）',
      '禁止中线两侧不同高不同宽',
      '禁止扫光 / 白闪作为高光时刻',
    ],
  },

  // =========================================================================
  // 5 极简动态图形
  // =========================================================================
  {
    id: 'cards',
    n: 5,
    name: '极简动态图形',
    look: '米白底、粗几何实色块、电光蓝配橙，硬投影 offset 8px；没有圆角、没有渐变、没有发光。',
    fit: '清单、日更、批量生产、一个知识点；主题是三件事、逐项检查、知识矩阵。对不上其他四套时也用这套。',
    base: {
      kind: 'light-paper',
      canvas: '#FAF9F7',
      backdrop: 'gradient',
      field: '#FAF9F7',
      fieldEnd: '#F2F0EC',
      titleGutter: false,
    },
    role: {
      primary: '#2563EB', // 电光蓝
      primaryLight: '#60A5FA',
      primaryDeep: '#1E40AF',
      primaryTech: '#2563EB',
      primaryPale: '#DBEAFE',
      accent: '#F97316', // 橙
      neg: '#DC2626',
      ok: '#16A34A',
      line: '#111111',
      text: '#111111',
      dim: '#6B7280',
      dimMid: '#E5E2DC',
      grid: '#111111',
      flash: '#FFFFFF',
    },
    type: {squeeze: 1, headlineWeight: 900, minPx: 24, numFamily: 'cjk'},
    shape: {sw: 0, radius: 0, lightMode: 'shadow', fillMode: 'solid'}, // 无描边、无圆角
    light: {
      hero: '8px 8px 0 rgba(17,17,17,.92)', // swiss 硬投影
      heroS: '6px 6px 0 rgba(37,99,235,.85)',
      accent: '6px 6px 0 rgba(249,115,22,.85)',
      neg: '6px 6px 0 rgba(220,38,38,.85)',
      text: 'none',
      bloom: 'none',
    },
    overlay: {
      hudFill: '#111111',
      hudText: '#FAF9F7',
      hudStroke: 'rgba(17,17,17,1)',
      barFill: 'rgba(37,99,235,.55)',
      barTrack: 'rgba(17,17,17,.14)',
      subColor: '#111111',
      subStroke: '#FAF9F7',
      cardNum: '#2563EB',
    },
    assets: {useImageGen: false, spec: null},
    setPiece: 'headline',
    forbid: [
      '禁止发光、渐变、玻璃（本套只有实色 + 硬投影）',
      '禁止圆角与细线描边（`sw` 恒为 0）',
      '禁止一屏超过 4 个色块',
      '禁止白字（浅底上不可读）',
      '禁止扫光作为高光时刻',
    ],
  },
];

// ---------------------------------------------------------------------------
// 预选：主题 → 风格。命中即停，顺序即优先级。
// ---------------------------------------------------------------------------
const RULES: Array<{id: StyleId; test: RegExp}> = [
  {id: 'compare', test: /区别|对比|过时了吗|哪个好|选哪个|SEO\s*和\s*GEO|SEO\s*与\s*GEO|GEO\s*和\s*SEO|GEO\s*与\s*SEO/},
  {id: 'cards', test: /清单|日更|批量|一个知识点|三件事|逐项检查|几步/},
  {id: 'growth', test: /获客|转化|案例|咨询|闭环|客户还是不来|成交|复购/},
  {id: 'citation', test: /引用|信源|知识库|被写进答案|被 AI 理解|结构化内容|内容结构/},
  {id: 'dashboard', test: /排名|流量|关键词|收录|曝光|技术能力|数据大屏|监控/},
];

/**
 * 按主题或口播预选一套。主题同时命中多套时按 RULES 顺序取第一个。
 * 对不上任何信号时用 dashboard（第 1 套）：它的语法最通用，且不会像浅底那样反转字幕与调色板。
 */
export function pickDefaultStyle(topic: string): StyleId {
  const hit = RULES.find((rule) => rule.test.test(topic));
  return hit?.id ?? 'dashboard';
}

export function styleById(id: StyleId): StyleTokens {
  const found = STYLES.find((style) => style.id === id);
  if (!found) throw new Error(`unknown style: ${id}`);
  return found;
}

/** 五套一起给用户看的摘要（编号 / 名称 / 气质 / 适配），不含技术参数。 */
export function styleMenu(): Array<{n: number; id: StyleId; name: string; look: string; fit: string}> {
  return STYLES.map((s) => ({n: s.n, id: s.id, name: s.name, look: s.look, fit: s.fit}));
}