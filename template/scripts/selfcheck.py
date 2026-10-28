#!/usr/bin/env python3
"""主会话静态自检（不渲染，几秒跑完；与 QC 从像素查互补）：
  1) 帧覆盖：各组 index.ts 里的 {id, from, to} 与 分镜表.md 的镜头区间对账，报空洞 / 重叠 / 缺失；
  2) 闪烁白名单：每个 SCxx.tsx 里 GlitchIn 的出现次数 vs 分镜表全局约束 §3 白名单；
  2b) 扫光白名单：用了 LightSweep / StageLine / GhostText 的 SC 文件 vs 分镜表「扫光白名单」（全片 ≤2 个镜头，common-rules §6；第 3/4/5 套应为 0，见该套 S8）；组共用文件里出现的另列出供人工核对；
  3) 画面字面量：抽取各 SC 文件里会上画面的字符串，剔除 CSS / 标识符噪声，列出不在事实清单里的词供人工核对。
用法：python3 scripts/selfcheck.py [--root <项目根>] [G1 G2 …]（不传组则查全部已建组）"""
import re, os, sys, glob
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if '--root' in sys.argv:
    i = sys.argv.index('--root'); ROOT = os.path.abspath(sys.argv[i + 1]); del sys.argv[i:i + 2]
sb = open(f'{ROOT}/分镜表.md', encoding='utf-8').read() if os.path.exists(f'{ROOT}/分镜表.md') else ''

# ---- 分镜表镜头区间 ----
sb_shots = {}
for m in re.finditer(r'^\| (SC\d\d)[^|]*\| (\d+)–(\d+) \|', sb, re.M):
    sb_shots[m.group(1)] = (int(m.group(2)), int(m.group(3)))

# ---- 白名单 ----
wl_text = re.search(r'\*\*闪烁白名单.*?\*\*：(.*?)。\*\*不在表内', sb, re.S)
whitelist = {}
if wl_text:
    for part in wl_text.group(1).split('·'):
        mm = re.match(r'\s*(SC\d\d)\s+(.*)', part.strip())
        if mm: whitelist[mm.group(1)] = mm.group(2).strip()

groups = sys.argv[1:] or sorted(os.path.basename(p) for p in glob.glob(f'{ROOT}/src/shots/G*'))
problems = 0

# ---- 1) 帧覆盖 ----
built = {}
for g in groups:
    idx = f'{ROOT}/src/shots/{g}/index.ts'
    if not os.path.exists(idx): continue
    src = open(idx, encoding='utf-8').read()
    for m in re.finditer(r"id:\s*'([^']+)'\s*,\s*from:\s*(\d+)\s*,\s*to:\s*(\d+)", src):
        built[m.group(1)] = (int(m.group(2)), int(m.group(3)), g)
    if not re.search(r"id:\s*'", src):
        print(f'[coverage] {g}: index.ts 里没有字面量 from/to（可能用了常量）→ 请人工核对')
print(f'[coverage] 分镜表 {len(sb_shots)} 镜头；已建 {len(built)} 镜头')
for sid, (a, b) in sorted(sb_shots.items()):
    if sid in built:
        ba, bb, g = built[sid]
        if (ba, bb) != (a, b):
            print(f'  ✗ {sid} ({g}) 区间 {ba}–{bb} ≠ 分镜表 {a}–{b}'); problems += 1
import json
try:
    _cfg_txt = open(f'{ROOT}/src/config.ts', encoding='utf-8').read()
except OSError:
    _cfg_txt = ''
_m_style = re.search(r"style:\s*'(dashboard|citation|growth|compare|cards)'", _cfg_txt)
STYLE = _m_style.group(1) if _m_style else 'dashboard'

_tl_path = f'{ROOT}/script/timeline.json'
if os.path.exists(_tl_path):
    _tl = json.load(open(_tl_path, encoding='utf-8'))
    _chapter_starts = {c['from'] for c in _tl['chapters']}
else:
    _tl_ts = open(f'{ROOT}/src/common/timeline.ts', encoding='utf-8').read() if os.path.exists(f'{ROOT}/src/common/timeline.ts') else ''
    _chapter_starts = {int(m.group(1)) for m in re.finditer(r'from:\s*(\d+)', _tl_ts.split('SENTENCES')[0])}
ids = sorted(built, key=lambda k: built[k][0])
for p, q in zip(ids, ids[1:]):
    gap = built[q][0] - built[p][1]
    # 章节卡占位（上一章末句 to+3 → 本章首句 from−9）是设计上的空洞，跳过
    if gap > 1 and any(built[q][0] == cs - 8 for cs in _chapter_starts):  # 下一镜头首帧 = 本章首句 from−8
        print(f'  · 章节卡空档 {p}→{q}: {built[p][1]}→{built[q][0]}（覆盖层接管）'); continue
    if gap > 1: print(f'  ✗ 空洞 {p}→{q}: {built[p][1]}→{built[q][0]} ({gap-1} 帧无镜头)'); problems += 1
    if gap < -4: print(f'  ✗ 重叠 {p}→{q}: {-gap+1} 帧'); problems += 1

# ---- 2) 闪烁 ----
print(f'[glitch] 白名单 {len(whitelist)} 条')
for g in groups:
    for f in sorted(glob.glob(f'{ROOT}/src/shots/{g}/SC*.tsx')):
        sid = os.path.basename(f)[:4]
        src = open(f, encoding='utf-8').read()
        n = len(re.findall(r'<GlitchIn\b', src)) + len(re.findall(r'glitchOpacity\(', src))
        want = 1 if sid in whitelist else 0
        flag = '' if n == want else '  ✗'
        if n != want: problems += 1
        print(f'  {sid} GlitchIn×{n} (白名单 {whitelist.get(sid, "—")}){flag}')

# ---- 2b) 扫光 ----
sw = re.search(r'扫光白名单[^：:\n]*[：:]\s*([^\n]*)', sb)
sweep_wl = set(re.findall(r'SC\d\d', sw.group(1))) if sw else set()
print(f'[sweep] 扫光白名单 {len(sweep_wl)} 条{"（分镜表没写扫光白名单 → 任何扫光都算超标）" if not sw else ""}：{" ".join(sorted(sweep_wl)) or "—"}')
SWEEP = re.compile(r'<(LightSweep|StageLine|GhostText)\b')
for g in groups:
    for f in sorted(glob.glob(f'{ROOT}/src/shots/{g}/*.tsx')):
        src = open(f, encoding='utf-8').read(); hits = sorted(set(SWEEP.findall(src)))
        if not hits: continue
        base = os.path.basename(f); sid = base[:4]
        if re.match(r'SC\d\d', sid):
            ok = sid in sweep_wl
            if not ok: problems += 1
            print(f'  {sid} 用了 {"/".join(hits)}{"" if ok else "  ✗ 不在扫光白名单"}')
        else:
            print(f'  {g}/{base}（共用文件）含 {"/".join(hits)} → 人工核对哪些镜头调用')
SWEEP_MAX = {'citation': 1, 'dashboard': 0, 'growth': 0, 'compare': 0, 'cards': 0}.get(STYLE, 0)
if len(sweep_wl) > SWEEP_MAX:
    print(f'  ✗ 风格 {STYLE} 扫光白名单 {len(sweep_wl)} 条 > 本套上限 {SWEEP_MAX}（citation ≤1，其余四套禁用扫光）'); problems += 1

# ---- 2c) 镜头字面色值检查（镜头只准用 theme/ui 语义令牌）----
print(f'[colors] 检查镜头源码字面色值（风格 {STYLE}）：')
COLOR_LIT = re.compile(r'#[0-9A-Fa-f]{3,8}\b|\brgba?\s*\(')
color_hits = 0
for g in groups:
    for f in sorted(glob.glob(f'{ROOT}/src/shots/{g}/*.tsx')):
        src_no_cmt = re.sub(r'//.*?$|/\*.*?\*/', '', open(f, encoding='utf-8').read(), flags=re.M | re.S)
        hits = COLOR_LIT.findall(src_no_cmt)
        if hits:
            color_hits += len(hits); problems += 1
            print(f'  ✗ {g}/{os.path.basename(f)} 含字面色值 {hits[:5]}（请改用 PRIMARY/ACCENT/NEG/PANEL/withAlpha 等语义令牌）')
if not color_hits:
    print('  OK（0 处字面色值）')

# ---- 2d) 首帧封面（禁首帧黑屏）与防横向挤压检查 ----
print('[cover] 检查首帧封面（N=1 禁黑场 / 禁关闭幕底）：')
ov_idx_path = f'{ROOT}/src/overlay/index.ts'
ov_tsx_path = f'{ROOT}/src/overlay/Overlay.tsx'
cover_ok = True
if os.path.exists(ov_idx_path):
    ov_idx_txt = open(ov_idx_path, encoding='utf-8').read()
    if re.search(r"from:\s*1[^}]*stars:\s*'none'", ov_idx_txt):
        print("  ✗ src/overlay/index.ts 在 from: 1 关闭了幕底 (stars: 'none')，会导致抖音首帧封面纯黑！")
        problems += 1; cover_ok = False
if os.path.exists(ov_tsx_path):
    ov_tsx_txt = open(ov_tsx_path, encoding='utf-8').read()
    title_block = ov_tsx_txt.split('CHAPTER_CARDS')[0] if 'CHAPTER_CARDS' in ov_tsx_txt else ov_tsx_txt
    if re.search(r'fadeIn\(\s*n', title_block):
        print("  ✗ src/overlay/Overlay.tsx 的 Title 组件使用了 fadeIn(n, ...)，首帧 N=1 透明度为 0 会导致封面黑屏！")
        problems += 1; cover_ok = False
if cover_ok:
    print('  OK（首帧幕底与片头封面正常开启）')

print('[squeeze] 检查中文横向压扁（SQUEEZE=1 / 禁 scaleX(<0.95)）：')
squeeze_hits = []
for check_p in [f'{ROOT}/src/styles.ts', f'{ROOT}/src/common/lib.tsx', f'{ROOT}/src/overlay/Overlay.tsx'] + glob.glob(f'{ROOT}/src/shots/G*/*.tsx'):
    if not os.path.exists(check_p): continue
    txt_nc = re.sub(r'//.*?$|/\*.*?\*/', '', open(check_p, encoding='utf-8').read(), flags=re.M | re.S)
    bad_sq = re.findall(r'(?:squeeze\s*:\s*0\.[0-8]\d*|scaleX\(\s*0\.[0-8]\d*\s*\))', txt_nc)
    if bad_sq:
        squeeze_hits.append((os.path.relpath(check_p, ROOT), bad_sq))
if squeeze_hits:
    for rel_p, bsq in squeeze_hits:
        print(f'  ✗ {rel_p} 存在横向压扁 {bsq}（请改为 1，用字号缩放或折行代替压扁）')
        problems += 1
else:
    print('  OK（0 处横向压扁，全部保持 1:1 自然字宽）')

# ---- 3) 字面量 ----
fact = re.search(r'1\. \*\*事实清单.*?\n', sb, re.S)
fact_txt = (fact.group(0) if fact else '') + sb  # 分镜表全文都算"已核"（画面文本按分镜写）
noise = re.compile(r'^(#|rgb|[0-9.\s%pxem-]+$|[a-z][A-Za-z0-9]*$|\.\./|src/|[A-Z_]+$|none|auto|absolute|relative|center|left|right|top|bottom|solid|dashed|round|butt|square|nowrap|hidden|visible|inherit|bold|italic|normal)')
print('[literals] 不在分镜表/事实清单中的画面字符串（人工核对）：')
seen = set()
for g in groups:
    for f in sorted(glob.glob(f'{ROOT}/src/shots/{g}/*.tsx')):
        src = open(f, encoding='utf-8').read()
        for s in re.findall(r"(?:'|\"|`)([^'\"`\n]{3,80})(?:'|\"|`)", src):
            s2 = s.strip()
            if not s2 or noise.match(s2) or s2 in seen: continue
            if '${' in s2 or 'px' in s2 or 'rgba' in s2 or 'gradient' in s2 or re.fullmatch(r'[\d.,\s]+', s2) or s2.startswith('./') or re.match(r'^[a-zA-Z-]+\(', s2) or s2 in ('border-box','content-box'): continue  # CSS / 模板串 / 路径噪声
            if re.fullmatch(r'[\d.,×x%+\-–\s]+', s2): pass  # 数字类一律列出
            elif not re.search(r'[A-Za-z]{3}', s2): continue
            if s2 in fact_txt or s2 in sb: continue
            seen.add(s2); print(f'  {os.path.basename(f)}: {s2}')
print(f'\nproblems: {problems}')
