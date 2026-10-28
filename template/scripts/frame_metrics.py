#!/usr/bin/env python3
"""
逐镜头构图/光/运动量化（配 reference/common-rules.md §构图与光 与 agent-qc-rules.md）。
用法：
  python3 scripts/frame_metrics.py [--frames fin_frames] [--storyboard 分镜表.md] [--shots SC11:1627-1806,SC12:1852-1965] [--step 4] [--out qc/frame_metrics_vN.md]
默认从 分镜表.md 解析 `| SCxx … | a–b |` 行得到镜头区间；帧目录默认 fin_frames/f_%04d.jpg。
每镜头输出：主体尺度（最大物体高度，宽物体按 min(w,4h)/2.5 折算；一行大字按整行计）中位数/最小值、空场最长连续帧数（无 ≥110 主体且无大面积光活动）、柔光面积（主角区 / 全区）中位数、主色碎片数中位数、最长静止帧数、标记。
依赖：numpy pillow scipy。亮度统计用 int32。
"""
import argparse, os, re, sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ap = argparse.ArgumentParser()
ap.add_argument('--frames', default='fin_frames')
ap.add_argument('--storyboard', default='分镜表.md')
ap.add_argument('--shots', default='')
ap.add_argument('--step', type=int, default=4)
ap.add_argument('--out', default='')
ap.add_argument('--rail-top', type=int, default=100, help='内容区上界（有流程轨的镜头可传 175）')
ap.add_argument('--bg', default='auto', help='幕底方案 stars|dots|gradient|footage|auto（auto 按 config.ts 的 style 从 styles.ts 取 base.backdrop）。dots 时按 DotFieldBg 的网格坐标把点阵抠掉再统计，否则波前亮点会被数成背景碎屑')
ap.add_argument('--style', default='auto', help='风格 id（dashboard|citation|growth|compare|cards）或 auto。决定柔光下限、点阵 mask 与碎片判据用的主色')
a = ap.parse_args()

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
try:
    _CFG = open(f'{ROOT}/src/config.ts', encoding='utf-8').read()
except OSError:
    _CFG = ''

def cfg_style():
    m = re.search(r"style:\s*'(dashboard|citation|growth|compare|cards)'", _CFG)
    return m.group(1) if m else 'dashboard'

STYLE = cfg_style() if a.style == 'auto' else a.style

# 底线类型、主色、幕底方案都从 styles.ts 读，避免在这个脚本里再抄一份色值。
try:
    _STYLES_TS = open(f'{ROOT}/src/styles.ts', encoding='utf-8').read()
except OSError:
    _STYLES_TS = ''

def style_meta(sid):
    """从 styles.ts 抠出该套的 kind / primary / backdrop / lightMode。抠不到就用深底默认值。"""
    blk = re.search(r"id:\s*'" + sid + r"'.*?forbid:", _STYLES_TS, re.S)
    if not blk:
        return {'kind': 'near-black', 'primary': '#6630F8', 'backdrop': 'dots', 'lightMode': 'glow'}
    t = blk.group(0)
    kind = (re.search(r"kind:\s*'([a-z-]+)'", t) or [None, 'near-black'])[1]
    primary = (re.search(r"primary:\s*'(#[0-9A-Fa-f]{6})'", t) or [None, '#6630F8'])[1]
    backdrop = (re.search(r"backdrop:\s*'([a-z]+)'", t) or [None, 'dots'])[1]
    light_mode = (re.search(r"lightMode:\s*'([a-z]+)'", t) or [None, 'glow'])[1]
    return {'kind': kind, 'primary': primary, 'backdrop': backdrop, 'lightMode': light_mode}

META = style_meta(STYLE)
IS_LIGHT = META['kind'].startswith('light')
BG = META['backdrop'] if a.bg == 'auto' else a.bg


# ---- 主色色相：碎片判据用它，而不是写死紫色 ----
def _hex_hue(h):
    h = h.lstrip('#')
    r, g, b = (int(h[i:i + 2], 16) / 255.0 for i in (0, 2, 4))
    mx, mn = max(r, g, b), min(r, g, b)
    d = mx - mn
    if d < 1e-6:
        return 0.0
    if mx == r:
        return (60 * ((g - b) / d)) % 360
    if mx == g:
        return 60 * ((b - r) / d) + 120
    return 60 * ((r - g) / d) + 240

def _hue_deg(r, g, b):
    """逐像素色相（0–360）。输入为 0–1 的 float 数组。"""
    mx = np.maximum(np.maximum(r, g), b)
    mn = np.minimum(np.minimum(r, g), b)
    d = mx - mn
    safe = np.where(d < 1e-6, 1.0, d)
    hr = ((60 * ((g - b) / safe)) % 360)
    hg = 60 * ((b - r) / safe) + 120
    hb = 60 * ((r - g) / safe) + 240
    out = np.where(mx == r, hr, np.where(mx == g, hg, hb))
    return np.where(d < 1e-6, 0.0, out)

def _hue_dist(a, b):
    d = np.abs(a - b) % 360
    return np.minimum(d, 360 - d)

PRIMARY_HUE = _hex_hue(META['primary'])

def dot_mask(W=1280, H=720, r=5):
    """点阵波幕底的屏幕坐标掩膜（与 src/common/DotFieldBg.tsx 同一组常量：设计坐标 960×540、步距 36、起点 (24,18)、等比放大）。
    点半径实际 2–2.7px，JPEG 再糊 1px，掩 5px 足够；点距 48px，掩掉的面积 <4%，对真实主体的统计影响可忽略。"""
    m = np.zeros((H, W), bool)
    if BG != 'dots':
        return m
    sc = max(W / 960, H / 540); ox = (W - 960 * sc) / 2; oy = (H - 540 * sc) / 2
    yy, xx = np.ogrid[-r:r + 1, -r:r + 1]; disc = (xx * xx + yy * yy) <= r * r
    for y in range(18, 540, 36):
        for x in range(24, 960, 36):
            cx = int(round(ox + x * sc)); cy = int(round(oy + y * sc))
            y0, y1 = max(0, cy - r), min(H, cy + r + 1); x0, x1 = max(0, cx - r), min(W, cx + r + 1)
            if y1 <= y0 or x1 <= x0: continue
            m[y0:y1, x0:x1] |= disc[(y0 - cy + r):(y1 - cy + r), (x0 - cx + r):(x1 - cx + r)]
    return m
DOT_MASK = dot_mask()
# 柔光判据的亮度窗口按底色类型定（三套深底、两套浅底，判据不能共用一套窗口）：
#   深底点阵：#0b0c11 带一点蓝（sat≈.35、lum≈12）会整屏落进柔光判据 → 下限抬到 22（实测底色+噪点 ≤18）
#   深底渐变 / 实拍：下限 10（原判据），上限 110
#   浅底（light-*）：背景 lum>200、主色是深饱和块 → 改为找 lum<150 的饱和块，下限 10
SOFT_LO = 22 if (BG == 'dots' and not IS_LIGHT) else 10
SOFT_HI = 150 if IS_LIGHT else 110

def parse_shots():
    if a.shots:
        out = []
        for tok in a.shots.split(','):
            sid, rng = tok.split(':'); lo, hi = re.split(r'[–-]', rng)
            out.append((sid, int(lo), int(hi)))
        return out
    out = []
    for line in open(a.storyboard, encoding='utf-8'):
        m = re.match(r'^\|\s*(SC\d+)[^|]*\|\s*(\d+)\s*[–-]\s*(\d+)\s*\|', line)
        if m:
            out.append((m.group(1), int(m.group(2)), int(m.group(3))))
    # 去重（分镜表后面的白名单/衔接表也以 SC 开头但没有帧区间列，正则已排除）
    seen = {}
    for s in out:
        seen.setdefault(s[0], s)
    return list(seen.values())

def frame_path(i):
    p = os.path.join(a.frames, f'f_{i:04d}.jpg')
    return p if os.path.exists(p) else os.path.join(a.frames, f'frame_{i:04d}.jpg')

Z = slice(a.rail_top, 621)

def analyze(i):
    im = Image.open(frame_path(i)).convert('RGB'); arr = np.asarray(im).astype(np.int32)
    r, g, b = arr[..., 0], arr[..., 1], arr[..., 2]
    lum = (r * 299 + g * 587 + b * 114) // 1000
    mx = arr.max(2); mn = arr.min(2); sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1), 0)
    if IS_LIGHT:
        # 浅底（compare / cards）：深色字线（lum<215）或有色色块（sat>0.18）算前景物体
        bright = (lum[Z] < 215) | (sat[Z] > 0.18)
    else:
        bright = (lum[Z] > 120) & ~DOT_MASK[Z]   # 点阵波幕底（BG='dots'）的点先抠掉，不然波前 40–60 个亮点会被数成碎屑
    # 横向 41 / 纵向 13 的结构元：把一行大字的字与字（含千分位逗号、字距 ≤40px）并成一个物体，但不会把间距 ≥50 的胶囊行并起来
    obj = ndi.binary_dilation(bright, structure=np.ones((13, 41), bool))
    lab, n = ndi.label(obj)
    hero_h = 0; hero_box = None; small = 0
    if n:
        ink = ndi.sum(bright, lab, index=np.arange(1, n + 1))  # 每个物体的实际亮像素数（星点只有 2–16px，排除）
        for k, s in enumerate(ndi.find_objects(lab)):
            if s is None or ink[k] < 30: continue
            h = s[0].stop - s[0].start; w = s[1].stop - s[1].start
            if h < 60 and w < 60: small += 1
            # 主体尺度：高度，或"宽度折算"——宽而不细的物体（一行大字、宽卡）按 min(w, 4h)/2.5 计，细线（h 很小）几乎不加分
            size = max(h, min(w, 4 * h) / 2.5)
            if size > hero_h: hero_h = size; hero_box = s
    soft = (sat[Z] > 0.25) & (lum[Z] > SOFT_LO) & (lum[Z] < SOFT_HI) & ~DOT_MASK[Z]
    glow_total = int(soft.sum())  # 全内容区柔光面积：扫光 / 光线 / 光环阶段很大 → 这类帧不算空场
    glow_hero = 0
    if hero_box is not None:
        y0 = max(0, hero_box[0].start - 30); y1 = hero_box[0].stop + 30
        x0 = max(0, hero_box[1].start - 30); x1 = hero_box[1].stop + 30
        sub = soft[y0:y1, x0:x1]
        if sub.any():
            lab2, n2 = ndi.label(sub)
            glow_hero = int(np.bincount(lab2.ravel())[1:].max()) if n2 else 0
    # 主色碎片：实心的高饱和主色块（排除柔光雾与虚线波纹），不膨胀，≥80px 才算一块。
    # 判据按当前风格的主色色相 ±25° 算 —— 早先写死「b>r>g」只能测紫色，五套风格里有四套会算成 0。
    if IS_LIGHT:
        frag = (sat[Z] > 0.45) & (lum[Z] < 200)
    else:
        frag = (sat[Z] > 0.45) & (lum[Z] > 45)
    hue_z = _hue_deg(r[Z], g[Z], b[Z])
    # 主色族碎片：色相落在本套 role.primary ±25° 内的小面积色块。
    # 不叫「紫色」——第 1 套主色是青、第 3 套是暖金，写死紫色会在那些片子里恒为 0。
    frag_main = frag & (_hue_dist(hue_z, PRIMARY_HUE) < 25)
    lab3, n3 = ndi.label(ndi.binary_dilation(frag_main, structure=np.ones((7, 25), bool)))  # 把一行字的逐字硬投影并成一块
    n_main = int((np.bincount(lab3.ravel())[1:] >= 80).sum()) if n3 else 0
    return hero_h, glow_hero, n_main, small, int(bright.sum()), glow_total

def diff_series(lo, hi):
    prev = None; out = []
    for i in range(lo, hi + 1):
        im = Image.open(frame_path(i)); im.draft('L', (320, 180)); l = np.asarray(im.convert('L').resize((320, 180))).astype(np.int32)
        out.append(0 if prev is None else float(np.abs(l - prev).mean())); prev = l
    return out

shots = parse_shots()
if not shots:
    sys.exit('没有解析到镜头区间：检查 --storyboard 或用 --shots')
lines = ['| 镜头 | 帧 | 主体尺度 中位/最小 px | 空场最长连续帧 | 柔光 主角区/全区 中位 px² | 主色碎片 中位 | 最长静止帧 | 标记 |', '|---|---|---|---|---|---|---|---|']
flags_total = {'高': 0, '中': 0, '低': 0}
for sid, lo, hi in shots:
    hh = []; gl = []; pp = []; sm = []; gt = []
    for i in range(lo, hi + 1, a.step):
        h, g, p, s, br, g_all = analyze(i)
        if br < 200: h = 0
        hh.append(h); gl.append(g); pp.append(p); sm.append(s); gt.append(g_all)
    hh = np.array(hh); gt = np.array(gt); run = 0; best = 0
    for h, g_all in zip(hh, gt):
        # 空场 = 没有 ≥110 的主体 **且** 没有大面积光活动（扫光 / 舞台光线 / 光环 的柔光 ≥10000px² 不算空；一根发光游标只有几千）
        run = run + 1 if (h < 110 and g_all < 10000) else 0; best = max(best, run)
    low_run = best * a.step
    d = diff_series(lo, hi); srun = 0; sbest = 0
    for v in d[1:]:
        srun = srun + 1 if v < 0.15 else 0; sbest = max(sbest, srun)
    flags = []
    # 主体尺度中位数只统计"非光效帧且有内容"的帧：高光时刻的扫光 / 光线阶段不算主角缺席
    solid = hh[(hh > 0) & ~((hh < 110) & (gt >= 10000))]
    med_h = float(np.median(solid)) if len(solid) else 0.0; min_h = int(hh.min())
    if low_run > 45:
        low_vals = hh[(hh < 110) & (hh > 0)]
        flags.append('高:空场(主体<80px>45帧)' if len(low_vals) and np.median(low_vals) < 80 else '中:空场(主体<110px>45帧)')
    elif med_h < 170:
        flags.append('低:主角<170px')
    if META['lightMode'] == 'glow' and float(np.median(gl)) < 800: flags.append('低:主角无光')
    if float(np.median(pp)) >= 8: flags.append('低:主色碎片≥8')
    if float(np.median(sm)) >= 10: flags.append('中:背景碎屑≥10')
    if sbest > 90: flags.append(f'中:静止{sbest}帧(>3s)')  # common-rules §落位停留：完全静止 >3 s 才是缺陷，不为凑动作加漂浮；落位停留看 motion_check 的 hold
    for f in flags:
        flags_total[f[0]] += 1
    lines.append(f'| {sid} | {lo}–{hi} | {med_h:.0f} / {min_h} | {low_run} | {np.median(gl):.0f} / {np.median(gt):.0f} | {np.median(pp):.0f} | {sbest} | {"；".join(flags) or "OK"} |')
head = f'# 构图/光/运动量化（{a.frames}，步长 {a.step}，风格 {STYLE} · 幕底 {BG}）\n\n标记合计：高 {flags_total["高"]} / 中 {flags_total["中"]} / 低 {flags_total["低"]}。判据见 reference/common-rules.md §构图与光。\n\n'
txt = head + '\n'.join(lines) + '\n'
if a.out:
    os.makedirs(os.path.dirname(a.out) or '.', exist_ok=True); open(a.out, 'w', encoding='utf-8').write(txt); print(a.out)
print(txt)
