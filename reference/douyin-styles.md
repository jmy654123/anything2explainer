# 五套画面风格，五只声音

数据在 `template/src/styles.ts`。每套画面只保留三样：风格（`look`）、素材（`platePrompt`）、适配（`fit`）。不含时长和分镜。

## 何时停

主题或口播已经在手上，分镜还没写，配音还没跑。把五套画面和五只声音一起给用户，然后停住。

1. `pickDefaultStyle(主题 + 口播)` 标出默认画面。
2. `pickDefaultVoice(这个画面 id)` 标出默认声音。
3. 每套画面只给用户看编号、名称、风格一句、适配一句。每只声音只给编号、名称、风格一句。素材 Prompt 等画面选定后再用。
4. 用户选定后，把 id 写进 `config.style` 和 `config.voice`。没写上之前不写分镜、不生成背景、不跑配音。
5. 口播分段之后读 `glass-frame.md` 再出图。不用 `platePrompt` 出整张意思底图。有词的卡各一件物件，出静帧前按该文核对。用户没要成片就不出视频；成片里指出的缺陷，静帧过了还要重渲成片。

## 画面默认

命中即停：

| 顺序 | id | 主题里出现 |
|---|---|---|
| 1 | compare | 区别、对比、SEO 和 GEO |
| 2 | cards | 清单、日更、批量、一个知识点、三件事 |
| 3 | growth | 获客、转化、案例、咨询、闭环 |
| 4 | citation | GEO、信源、引用、知识库、被写进答案 |
| 5 | dashboard | SEO、排名、流量、关键词、收录 |
| 都没有 | cards | 用极简 |

信源、引用、知识库走 citation，不因为提到搜索就改成大屏。

## 声音默认

跟着已选定的画面，用户可以改成另一只。中文都是 edge-tts，原速。

| 画面 | 默认声音 | edge |
|---|---|---|
| dashboard | 云扬 · 播报 | zh-CN-YunyangNeural |
| citation | 云希 · 讲解 | zh-CN-YunxiNeural |
| growth | 云健 · 有力 | zh-CN-YunjianNeural |
| compare | 晓晓 · 亲切 | zh-CN-XiaoxiaoNeural |
| cards | 晓伊 · 干脆 | zh-CN-XiaoyiNeural |

配音命令用选定音色：`VOICE=<edge> python3 scripts/tts_build.py`。换画面不重跑配音。换声音要重跑配音，口播词不变。
