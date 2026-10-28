/**
 * 五只声音。与画面风格**独立选择**：用户先定主题（据此锁定一套画面），再单独选声音。
 * `pickDefaultVoice(style)` 只给一个预选，不改用户的最终选择。
 *
 * 配音：`VOICE=<edge> python3 scripts/tts_build.py`（中文 edge-tts，`RATE=+0%` 原速不加速）。
 * 换画面不重跑配音；换声音要重跑配音，口播词不变。
 */
export type VoiceId = 'yunxi' | 'yunyang' | 'yunjian' | 'xiaoxiao' | 'xiaoyi';

export type VoiceStyle = {
  id: VoiceId;
  /** 给用户看的编号 1–5 */
  n: 1 | 2 | 3 | 4 | 5;
  name: string;
  /** 声音气质，给用户看 */
  look: string;
  /** edge-tts 音色。配音时传给 VOICE */
  edge: string;
};

export const VOICES: VoiceStyle[] = [
  {id: 'yunxi', n: 1, name: '云希 · 讲解', look: '男声，平稳，把一件事讲清楚', edge: 'zh-CN-YunxiNeural'},
  {id: 'yunyang', n: 2, name: '云扬 · 播报', look: '男声，新闻腔，适合数据和结论', edge: 'zh-CN-YunyangNeural'},
  {id: 'yunjian', n: 3, name: '云健 · 有力', look: '男声，力度大，适合判断和转化', edge: 'zh-CN-YunjianNeural'},
  {id: 'xiaoxiao', n: 4, name: '晓晓 · 亲切', look: '女声，温和，适合对照和解释', edge: 'zh-CN-XiaoxiaoNeural'},
  {id: 'xiaoyi', n: 5, name: '晓伊 · 干脆', look: '女声，利落，适合清单和短知识点', edge: 'zh-CN-XiaoyiNeural'},
];

/**
 * 画面 → 默认声音（只作预选，用户可改）。
 * 依据是「画面的信息密度」：数据密集 → 播报腔；链路讲解 → 平稳；转化判断 → 有力；
 * 对照 → 亲切；清单 → 干脆。
 */
const VOICE_FOR_STYLE: Record<string, VoiceId> = {
  dashboard: 'yunyang',
  citation: 'yunxi',
  growth: 'yunjian',
  compare: 'xiaoxiao',
  cards: 'xiaoyi',
};

/** 画面风格定了之后，预选一只声音。用户可改成任意一只。 */
export function pickDefaultVoice(style: string): VoiceId {
  return VOICE_FOR_STYLE[style] ?? 'yunxi';
}

export function voiceById(id: VoiceId): VoiceStyle {
  const found = VOICES.find((voice) => voice.id === id);
  if (!found) throw new Error(`unknown voice: ${id}`);
  return found;
}

/** 五只一起给用户看的摘要（编号 / 名称 / 气质）。 */
export function voiceMenu(): Array<{n: number; id: VoiceId; name: string; look: string}> {
  return VOICES.map((v) => ({n: v.n, id: v.id, name: v.name, look: v.look}));
}