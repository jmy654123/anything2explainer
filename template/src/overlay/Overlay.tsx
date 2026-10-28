import React from 'react';
import {useCurrentFrame} from 'remotion';
import {GlitchIn, kf, emphasisPulse, easeInOutPow, SENTENCES, TOTAL_FRAMES, CHAPTER_STARTS, FONT_HEAVY, FONT_WIDE, FONT_ORB, clamp01, SQUEEZE, fitSize, EM_WIDE} from '../common';
import {CText, TechText, TechSub, Pill, TopCapsule, ArrowH, PRIMARY, PRIMARY_TECH, DIM, DIM_MID, TEXT, LINE, PANEL, SW, GLOW_HERO, GLOW_HERO_S, PILL_SHADOW, fadeIn, slideUp, withAlpha} from '../ui';
import {TOKENS, IS_LIGHT, IS_GLOW, FONT_NUM, FONT_DISPLAY} from '../theme';
import {VIDEO} from '../config';
const clampFrames = (n: number, len: number) => clamp01(n / len);

// ---------- 时间轴查询 ----------
export const S = (id: string) => {
  const s = SENTENCES.find((x) => x.id === id);
  if (!s) throw new Error(`config 引用了不存在的句 id ${id}（请对照 script/timeline.md）`);
  return s;
};

/** 12 帧加速上出：n<0 → 原位；位移 (n/11)^2·440px，透明度 1−(n/11)^1.6 → 末帧 0（QC v1 C1 #1/#2） */
const exitOut = (n: number) => {
  if (n < 0) return {dy: 0, op: 1};
  const t = Math.min(1, n / 11);
  return {dy: t * t * 440, op: 1 - Math.pow(t, 1.6)};
};

// ---------- 片头 ----------
// 配音未生成时（timeline.ts 占位、SENTENCES 为空）用兜底值，让探针 still 能渲染
export const TITLE_RANGE: [number, number] = [1, (SENTENCES[0]?.from ?? 100) - 9];
export const Title: React.FC = () => {
  const N = useCurrentFrame() + TITLE_RANGE[0];
  const [a, b] = TITLE_RANGE;
  const exitN = N - (b - 11);
  const dy = -exitOut(exitN).dy;
  const op = exitOut(exitN).op;
  const glow = 0.5 + 0.5 * Math.sin((N / 30) * Math.PI);
  return (
    <div style={{position: 'absolute', inset: 0, transform: `translateY(${dy}px)`, opacity: op}}>
      {/* Top glowing HUD capsule on Cover */}
      <Pill
        x={640 - 250}
        y={86}
        w={500}
        h={48}
        fill={TOKENS.overlay.hudFill}
        stroke={PRIMARY_TECH}
        sw={2}
        text={VIDEO.credit?.kicker || 'GENERATIVE ENGINE OPTIMIZATION'}
        fontSize={20}
        weight={800}
        family={FONT_ORB}
        color={PRIMARY_TECH}
        letterSpacing={2}
        glow={GLOW_HERO_S}
      />
      {/* Main Cover Hero Card & Title (100% visible at N=1 for Douyin cover!) */}
      <div style={{position: 'absolute', left: 140, top: 166, width: 1000, height: 320, borderRadius: 16, background: withAlpha(PANEL, 0.56), border: `2px solid ${withAlpha(PRIMARY, 0.65)}`, boxShadow: GLOW_HERO}} />
      <div style={{position: 'absolute', left: 0, top: 206, width: 1280, display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 24}}>
        <span style={{fontFamily: FONT_DISPLAY, fontWeight: TOKENS.type.headlineWeight, fontSize: fitSize(VIDEO.title.big, VIDEO.title.rest ? 560 : 1080, 112, 64, TOKENS.type.numFamily === 'orb' ? EM_WIDE : 1, 6), color: TEXT, lineHeight: 1, letterSpacing: 6, textShadow: IS_GLOW ? `0 0 ${18 + 14 * glow}px ${withAlpha(PRIMARY, 0.65 + 0.25 * glow)}, 5px 5px 0 ${PRIMARY}` : GLOW_HERO}}>{VIDEO.title.big}</span>
        {VIDEO.title.rest ? (
          <span style={{fontFamily: FONT_HEAVY, fontWeight: 900, fontSize: fitSize(VIDEO.title.rest, 520, 92, 58, 1, 4), color: TEXT, lineHeight: 1, letterSpacing: 4, textShadow: GLOW_HERO_S}}>{VIDEO.title.rest}</span>
        ) : null}
      </div>
      <TechText cx={640} cy={358} text={VIDEO.title.en} fontSize={30} scaleX={1} weight={700} letterSpacing={1.5} />
      <div style={{position: 'absolute', left: 340, top: 392, width: 600, height: 2, background: withAlpha(PRIMARY, 0.55), boxShadow: GLOW_HERO_S}} />
      <CText cx={640} cy={434} size={32} weight={800} color={TEXT} letterSpacing={3} shadow={GLOW_HERO_S}>
        {VIDEO.title.tagline}
      </CText>
      {/* Bottom 3 Chapter Preview Pills on Cover */}
      {CHAPTER_STARTS.slice(0, 3).map((c, i) => {
        const pw = 276;
        const gap = 36;
        const totalW = 3 * pw + 2 * gap;
        const x0 = 640 - totalW / 2 + i * (pw + gap);
        return (
          <Pill
            key={c.n}
            x={x0}
            y={526}
            w={pw}
            h={54}
            fill={i === 0 ? PRIMARY : withAlpha(PANEL, 0.82)}
            stroke={PRIMARY}
            sw={2}
            text={`0${c.n} · ${c.title}`}
            fontSize={23}
            weight={800}
            color={TEXT}
            letterSpacing={1.5}
            glow={i === 0 ? GLOW_HERO_S : undefined}
          />
        );
      })}
    </div>
  );
};

// ---------- 章节卡 ----------
/** 章节卡（第 2 章起）：占据上一章末句结束+3 → 本章首句 from−9（即 tts_build 的章前空白） */
const lastSentenceBefore = (frame: number) => [...SENTENCES].reverse().find((x) => x.to < frame)!;
export const CHAPTER_CARDS: Array<{n: number; title: string; tech: string; from: number; to: number}> = CHAPTER_STARTS.slice(1).map((c, i) => {
  const first = SENTENCES.find((x) => x.chapter === c.n)!;
  const prev = lastSentenceBefore(first.from);
  return {n: c.n, title: c.title, tech: VIDEO.chapterTech[i + 1] ?? '', from: prev.to + 3, to: first.from - 9};
});
export const ChapterCard: React.FC<{card: (typeof CHAPTER_CARDS)[number]}> = ({card}) => {
  const N = useCurrentFrame() + card.from;
  const n = N - card.from;
  const exitN = N - (card.to - 11);
  const dy = -exitOut(exitN).dy;
  const op = exitOut(exitN).op;
  const w = kf(n, [[0, 0], [20, 300]], easeInOutPow(2.5));
  return (
    <div style={{position: 'absolute', inset: 0, transform: `translateY(${dy}px)`, opacity: op}}>
      <div style={{position: 'absolute', opacity: fadeIn(n, 8)}}>
        <CText cx={640} cy={268} size={54} weight={700} family={FONT_NUM} color={TOKENS.overlay.cardNum} letterSpacing={4} shadow={IS_GLOW ? `0 0 14px ${withAlpha(PRIMARY, 0.6)}` : undefined}>{`0${card.n}`}</CText>
      </div>
      <GlitchIn N={N} f0={card.from + 3} rgbSplit={5} seed={card.n}>
        <CText cx={640} cy={372} size={fitSize(card.title, 1100, 80, 46, 1, 3)} weight={TOKENS.type.headlineWeight} scaleX={SQUEEZE} letterSpacing={3} style={{WebkitTextStroke: `1px ${withAlpha(PANEL, 0.85)}`, paintOrder: 'stroke fill'}}>{card.title}</CText>
      </GlitchIn>
      <div style={{position: 'absolute', left: 640 - w / 2, top: 428, width: w, height: 3, background: LINE, opacity: 0.85}} />
      {card.tech ? (
        <div style={{position: 'absolute', opacity: fadeIn(n - 10, 10)}}>
          <TechSub cx={640} cy={470} text={card.tech} size={26} />
        </div>
      ) : null}
    </div>
  );
};

// ---------- 顶部 HUD 胶囊 ----------
export type HudEntry = {from: number; to: number; text: string; tech?: string; w?: number};
/** HUD 条目由 config.hud 的句 id 解析；章首条目从章节卡结束的下一帧开始（fromOffset 默认：本章第一条 −8，其余 0）。 */
export const HUD: HudEntry[] = (SENTENCES.length ? VIDEO.hud : []).map((h) => {
  const a = S(h.fromS), b = S(h.toS);
  const isChapterFirst = SENTENCES.find((x) => x.chapter === a.chapter)!.id === a.id && a.chapter > 1;
  const from = a.from + (h.fromOffset ?? (isChapterFirst ? -8 : 0));
  const isChapterLast = [...SENTENCES].reverse().find((x) => x.chapter === b.chapter)!.id === b.id;
  const to = b.to + (h.toOffset ?? (isChapterLast ? 2 : 0));
  return {from, to, text: h.text, tech: h.tech, w: h.w};
});
// 同章相邻条目之间不留空档（G1 提示 742–751 无胶囊）：上一条延到下一条 from−1；跨章节卡（间隔 ≥30 帧）保持空档，由章节卡接管
for (let i = 0; i < HUD.length - 1; i++) if (HUD[i + 1].from - HUD[i].to < 30) HUD[i].to = HUD[i + 1].from - 1;
export const HUD_RANGE: [number, number] = HUD.length ? [HUD[0].from, HUD[HUD.length - 1].to] : [0, 0];
const hudW = (h: HudEntry) => h.w ?? Math.max(216, Math.round(h.text.replace(/[^一-龥]/g, '').length * 34 + h.text.replace(/[一-龥\s]/g, '').length * 20 + (h.text.match(/\s/g)?.length ?? 0) * 10 + 60));
export const Hud: React.FC = () => {
  const N = useCurrentFrame() + HUD_RANGE[0];
  const idx = HUD.findIndex((h) => N >= h.from && N <= h.to);
  if (idx < 0) return null;
  const e = HUD[idx];
  // QC v1 C3：进章节卡前 HUD 一帧消失 → 末 8 帧淡出（只对跨章节卡的条目生效：下一条 from 与本条 to 间隔 ≥30）
  const nextGap = idx < HUD.length - 1 ? HUD[idx + 1].from - e.to : 999;
  const fadeTail = nextGap >= 30 ? 1 - clampFrames(N - (e.to - 8), 8) : 1;
  const w = hudW(e);
  // 终检 v2：同章换词时旧词单帧硬切 + 胶囊从 25% 重新淡入有 1 帧空白 → 胶囊常驻、宽度 10 帧过渡，旧词 6 帧淡出、新词 SoftIn
  const prev = idx > 0 ? HUD[idx - 1] : undefined;
  const n = N - e.from;
  const sameChapter = !!prev && e.from - prev.to < 30;
  if (sameChapter && prev && n < 10) {
    const t = easeInOutPow(2.5)(clampFrames(n, 10));
    const wNow = hudW(prev) + (w - hudW(prev)) * t;
    const oldOp = 1 - clampFrames(n, 4); // 第五片 QC：旧词 4 帧淡完再进新词（新词 n≥4 起），零叠影
    const newOp = 1 - Math.pow(1 - clampFrames(n - 3, 7), 2.5);
    return (
      <div style={{position: 'absolute', inset: 0, opacity: fadeTail}}>
        <Pill x={640 - wNow / 2} y={28} w={wNow} h={51} fill={TOKENS.overlay.hudFill} sw={SW} stroke={TOKENS.overlay.hudStroke} style={{filter: PILL_SHADOW}} />
        {oldOp > 0.01 ? <CText cx={640} cy={53.5} size={33} weight={700} color={TOKENS.overlay.hudText} letterSpacing={1} opacity={oldOp}>{prev.text}</CText> : null}
        <div style={{position: 'absolute', inset: 0, opacity: newOp, transform: `translateY(${((1 - newOp) * 4).toFixed(2)}px)`}}>
          <CText cx={640} cy={53.5} size={33} weight={700} color={TOKENS.overlay.hudText} letterSpacing={1}>{e.text}</CText>
          {e.tech ? <TechSub cx={640} cy={92} text={e.tech} /> : null}
        </div>
      </div>
    );
  }
  // 章首条目（章节卡之后）与过渡结束后：原 TopCapsule（SoftIn 在 n≥8 已满态，几何与上面一致，无缝）
  return <TopCapsule N={N} f0={e.from} text={e.text} w={w} tech={e.tech} opacity={fadeTail} />;
};

// ---------- 流程轨（只在 config.rails 标了轨的章出现）----------
export type RailSpec = {steps: string[]; switches: number[]; from: number; to: number};
export const RAILS: RailSpec[] = (SENTENCES.length ? VIDEO.rails : []).map((r) => ({steps: r.steps, switches: r.switchS.map((id) => S(id).from), from: S(r.fromS).from - 8, to: S(r.toS).to + 2}));
const RAIL_CX = [115, 256, 397, 538, 679];
const RAIL_W = 122, RAIL_H = 38, RAIL_Y = 124;
export const Rail: React.FC<{spec: RailSpec}> = ({spec}) => {
  const N = useCurrentFrame() + spec.from;
  let active = -1;
  spec.switches.forEach((f, i) => { if (N >= f) active = i; });
  const railOut = 1 - clampFrames(N - (spec.to - 8), 8);
  return (
    <div style={{position: 'absolute', inset: 0, opacity: railOut}}>
      {spec.steps.map((t, i) => {
        const state = i === active ? 'active' : i < active ? 'done' : 'todo';
        const pulse = i === active ? emphasisPulse(N - spec.switches[i], {peak: 1.06, up: 10, hold: 3, down: 10}) : 1;
        const fill = state === 'active' ? PRIMARY : state === 'done' ? DIM_MID : PANEL;
        const stroke = state === 'active' ? LINE : state === 'done' ? DIM_MID : DIM;
        const color = state === 'todo' ? DIM : TEXT;
        return (
          <React.Fragment key={t}>
            <div style={{position: 'absolute', left: RAIL_CX[i] - RAIL_W / 2, top: RAIL_Y + slideUp(N - (spec.from + i * 2), 30, 14), width: RAIL_W, height: RAIL_H, transform: `scale(${pulse})`, opacity: fadeIn(N - (spec.from + i * 2), 8)}}>
              <Pill x={0} y={0} w={RAIL_W} h={RAIL_H} fill={fill} stroke={stroke} sw={1.5} text={t} fontSize={17} weight={700} color={color} letterSpacing={0.5} textDy={-1} glow={state === 'active' ? GLOW_HERO_S : undefined} />
            </div>
            {i < spec.steps.length - 1 ? (
              <ArrowH x={RAIL_CX[i] + RAIL_W / 2 + 2} y={RAIL_Y + RAIL_H / 2 - 6} w={15} h={12} p={clampFrames(N - (spec.from + 4 + i * 2), 10)} color={i < active ? LINE : DIM} shaft={2} />
            ) : null}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ---------- 片尾 ----------
// 压黑层挂在内容之上（Main 里 SHOTS_OVERLAY_TOP 排在所有内容组之后、进度条之下），从末句结束前 endingFade 帧起压黑，末镜头内容在被完全盖住后才结束；
// 最后 30 帧再用 aboveBar 层把进度条也压黑 → 末段纯黑。
const LAST_TO = SENTENCES[SENTENCES.length - 1]?.to ?? TOTAL_FRAMES - 60;
export const ENDING_RANGE: [number, number] = [LAST_TO - VIDEO.endingFade, TOTAL_FRAMES];
export const Ending: React.FC = () => {
  const N = useCurrentFrame() + ENDING_RANGE[0];
  const n = N - ENDING_RANGE[0];
  const op = fadeIn(n, VIDEO.endingFade);
  return <div style={{position: 'absolute', inset: 0, background: IS_LIGHT ? TOKENS.base.canvas : '#000', opacity: op}} />;
};
/** 片尾署名（压黑之后、进度条压黑之前）：完整书名 / 作者 / 出版社，停 ≈3 s，让片头 tagline 读不完的信息在这里补齐（QC v1 C1 #1） */
export const END_CREDIT_RANGE: [number, number] = [LAST_TO + 1, TOTAL_FRAMES - 26];  // 9110–9182：末句字幕 9109 结束、内容已全黑后再出署名卡（满态 ≈56 帧）；之后 26 帧纯黑
export const EndCredit: React.FC = () => {
  const N = useCurrentFrame() + END_CREDIT_RANGE[0];
  const n = N - END_CREDIT_RANGE[0];
  const len = END_CREDIT_RANGE[1] - END_CREDIT_RANGE[0];
  const op = Math.min(fadeIn(n, 8), 1 - clampFrames(N - (END_CREDIT_RANGE[1] - 8), 8));
  const c = VIDEO.credit;
  const by = VIDEO.builtBy;
  if (!c && !by) return null;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: op}}>
      {c ? (
        <>
          <CText cx={640} cy={300} size={26} weight={500} color={DIM} letterSpacing={4}>{c.kicker}</CText>
          <CText cx={640} cy={352} size={40} weight={700} color={TEXT}>{c.title}</CText>
          <CText cx={640} cy={404} size={26} weight={500} color={DIM}>{c.byline}</CText>
          <div style={{position: 'absolute', left: 560, top: 440, width: 160, height: 2, background: withAlpha(LINE, 0.35), transform: `scaleX(${fadeIn(n - 6, 16)})`}} />
          <CText cx={640} cy={476} size={22} weight={500} color={DIM}>{c.note}</CText>
        </>
      ) : null}
      {/* 片尾署名行（config.builtBy，默认开）：有署名卡时排在卡下方，没有卡时单独居中 */}
      {by ? <CText cx={640} cy={c ? 524 : 384} size={22} weight={500} color={DIM_MID} letterSpacing={2}>{by}</CText> : null}
    </div>
  );
};
// QC v1 C4 #2：进度条不能在画面全黑后孤悬 2 s → 进度条随 endingFade 一起压黑（aboveBar 层），署名卡在其上（见 index.ts 层序）
export const ENDING_TOP_RANGE: [number, number] = [LAST_TO - VIDEO.endingFade, TOTAL_FRAMES];
export const EndingTop: React.FC = () => {
  const N = useCurrentFrame() + ENDING_TOP_RANGE[0];
  const op = fadeIn(N - ENDING_TOP_RANGE[0], VIDEO.endingFade);
  return <div style={{position: 'absolute', inset: 0, background: IS_LIGHT ? TOKENS.base.canvas : '#000', opacity: op}} />;
};
