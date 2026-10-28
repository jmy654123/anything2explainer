/**
 * 当前风格的派生层 —— 五套风格真正影响像素的唯一入口。
 *
 * 读 `config.ts` 的 `style`，从 `styles.ts` 取出那一套的 8 槽令牌，
 * 再派生成 `ui.tsx` / `fx.tsx` / `overlay` / `common` 需要的具名常量。
 *
 * 兼容策略：`ui.tsx` 仍然导出 `PURPLE` / `ORANGE` / `GLOW_PURPLE` 等旧名字，
 * 但它们的值现在来自本文件 —— 于是样片与所有镜头源码一行不改，颜色自动跟着 `config.style` 走。
 * 新写的镜头请直接用语义名（`PRIMARY` / `ACCENT` / `NEG` / `TEXT` / `GLOW_HERO`），
 * 旧名保留只为不破坏既有源码。
 */
import {VIDEO} from './config';
import {styleById, type StyleTokens} from './styles';
import {FONT_ORB, FONT_HEAVY, FONT_TECH, FONT_WIDE} from './common/lib';

export const TOKENS: StyleTokens = styleById(VIDEO.style);

// ---- 派生标量 ----
/** 浅底风格：字幕、面板、描边语义要反转 */
export const IS_LIGHT = TOKENS.base.kind === 'light-split' || TOKENS.base.kind === 'light-paper';
/** 深底风格：可以用发光；浅底改成投影 */
export const IS_DARK = !IS_LIGHT;
/** 面板填充：深底黑、浅底白（Box 的默认 fill） */
export const PANEL = IS_LIGHT ? '#FFFFFF' : '#000000';
/** 幕底方案（Main 按它选渲染器；config.bg 已废弃，唯一真相源在这里） */
export const BACKDROP = TOKENS.base.backdrop;

// ---- #rrggbb → rgba() ----
const hex2rgb = (hex: string): [number, number, number] => {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};
/** 给任意色值加透明度；传进来的可能是 hex 也可能是 rgba()，非 hex 一律原样返回（由调用方保证可用） */
export const withAlpha = (color: string, a: number): string => {
  const t = a.toFixed(3);
  if (!color.startsWith('#')) return color;
  const [r, g, b] = hex2rgb(color);
  return `rgba(${r},${g},${b},${t})`;
};

/** 当前风格是否启用发光（第 1/2 套为 true；第 3/4/5 套用投影，禁止满屏发光） */
export const IS_GLOW = TOKENS.shape.lightMode === 'glow';

/** 主色的柔光/投影强度版（k 0→1）。深底发光套返回按 k 缩放的双层主色柔光；投影套返回本套 S5 的 hero 投影（k≤0 时为 'none'）。 */
export const glowPrimary = (k: number): string => {
  const t = Math.max(0, Math.min(1, k));
  if (t <= 0.005) return 'none';
  if (!IS_GLOW) return TOKENS.light.hero;
  const c = TOKENS.role.primary;
  return `0 0 12px 3px ${withAlpha(c, 0.35 * t)}, 0 0 42px 14px ${withAlpha(c, 0.45 * t)}`;
};
/** 主色的小面积重点光/投影强度版（k 0→1） */
export const glowPrimaryS = (k: number): string => {
  const t = Math.max(0, Math.min(1, k));
  if (t <= 0.005) return 'none';
  if (!IS_GLOW) return TOKENS.light.heroS;
  return `0 0 24px 8px ${withAlpha(TOKENS.role.primary, 0.6 * t)}`;
};

// ---- 调色板（语义名，新代码用这一组）----
export const PRIMARY = TOKENS.role.primary;
export const PRIMARY_LIGHT = TOKENS.role.primaryLight;
export const PRIMARY_DEEP = TOKENS.role.primaryDeep;
export const PRIMARY_TECH = TOKENS.role.primaryTech;
export const PRIMARY_PALE = TOKENS.role.primaryPale;
export const ACCENT = TOKENS.role.accent;
export const NEG = TOKENS.role.neg;
export const OK = TOKENS.role.ok;
export const LINE = TOKENS.role.line;
export const TEXT = TOKENS.role.text;
export const DIM = TOKENS.role.dim;
export const DIM_MID = TOKENS.role.dimMid;
export const GRID = TOKENS.role.grid;
export const FLASH = TOKENS.role.flash;

// ---- 光（语义名）----
export const GLOW_HERO = TOKENS.light.hero;
export const GLOW_HERO_S = TOKENS.light.heroS;
export const GLOW_ACCENT = TOKENS.light.accent;
export const GLOW_NEG = TOKENS.light.neg;
export const GLOW_TEXT = TOKENS.light.text;
export const BLOOM_TOKEN = TOKENS.light.bloom;

// ---- 图元语法 ----
export const SW = TOKENS.shape.sw;
export const RADIUS = TOKENS.shape.radius;
export const SQUEEZE_STYLE = TOKENS.type.squeeze;
export const MIN_PX = TOKENS.type.minPx;
/** 数字字族（S3 numFamily）：orb 套用 Orbitron，cjk 套（growth/compare/cards）用 Noto Sans SC */
export const FONT_NUM = TOKENS.type.numFamily === 'orb' ? FONT_ORB : FONT_HEAVY;
/** 英文技术词字族（S3 numFamily）：orb 套用 Exo 2 斜体，cjk 套用 Noto Sans SC 正体 */
export const FONT_TECH_STYLE = TOKENS.type.numFamily === 'orb' ? FONT_TECH : FONT_HEAVY;
/** 片头/展示大字字族（S3 numFamily）：orb 套用 Audiowide 宽体，cjk 套用 Noto Sans SC 粗体 */
export const FONT_DISPLAY = TOKENS.type.numFamily === 'orb' ? FONT_WIDE : FONT_HEAVY;