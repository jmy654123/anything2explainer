import React from 'react';
import {Img, staticFile, useCurrentFrame} from 'remotion';
import type {BgSpec} from './types';
import {DotFieldBg} from './DotFieldBg';
import {BgTrack} from './StarField';
import {TOKENS, PANEL, IS_LIGHT} from '../theme';

/**
 * 幕底统一入口 —— 按当前风格的 `base.backdrop` 选渲染器，颜色全部来自令牌。
 *
 * 四选一（`reference/styles/<n>-<id>.md` 的 S1 槽）：
 *   dots     点阵波（深底科技感）
 *   stars    星点 + 底部雾底（早期样片）
 *   gradient 纯渐变（浅底套的白→浅雾，与第 1 套的「左黑右暗」环境光都走这条）
 *   footage  实拍打底（实拍层由 FootageTrack 单独叠，这里只铺压暗底）
 *
 * 镜头仍可用 `BG_Gn: [{from,to,stars:'none'}]` 在区间内关掉幕底（四套都支持），
 * 用于强调黑场 / 清场镜头。
 */
export const Backdrop: React.FC<{specs: BgSpec[]}> = ({specs}) => {
  const N = useCurrentFrame() + 1;
  const b = TOKENS.base;

  // 区间覆写：stars:'none' 在任一方案下都表示「这一段关掉幕底」；plate 可选指定第 1 套生图背景路径（如 assets/<slug>/plates/locked-room.jpg）
  let off = false;
  let plate: string | undefined;
  for (const s of specs) {
    if (N >= s.from && N <= s.to) {
      if (s.stars === 'none') off = true;
      if (s.plate !== undefined) plate = s.plate;
    }
  }
  if (off) return null;

  if (b.backdrop === 'dots') {
    return <DotFieldBg specs={specs} dotColor={b.dot} fieldColor={b.field} />;
  }
  if (b.backdrop === 'stars') {
    return <BgTrack specs={specs} fogFrom={b.field} fogTo={b.fieldEnd} />;
  }
  // gradient / footage：铺一层渐变，方向按底色类型分
  //  - 浅底（light-*）：从上到下，轻微明暗，用来托住卡片投影
  //  - 深底（dashboard / footage）：左黑右暗蓝的环境光，光只有一处、在右后方（第 1 套的版式前提）
  const grad =
    IS_LIGHT
      ? `linear-gradient(180deg, ${b.field} 0%, ${b.fieldEnd} 100%)`
      : `radial-gradient(120% 90% at 88% 62%, ${b.fieldEnd} 0%, ${b.field} 58%, ${b.field} 100%)`;
  return (
    <div style={{position: 'absolute', inset: 0, background: grad}}>
      {plate ? <Img src={staticFile(plate)} style={{position: 'absolute', inset: 0, width: 1280, height: 720, objectFit: 'cover'}} /> : null}
      {/* 浅底套加一层极淡纸纹，深底套不加（深底靠环境光分层） */}
      {IS_LIGHT ? <div style={{position: 'absolute', inset: 0, background: PANEL, opacity: 0.02}} /> : null}
    </div>
  );
};