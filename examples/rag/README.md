# 样片《RAG 与知识库》（2026-09-06，4′35″，8246 帧）

**第 1 套「未来科技数据大屏」（`dashboard`）的质量与风格标尺。**

本样片是**五套其实只有这一套**有完整成片可以对照。用法：

- **做第 1 套时**：它既是质量标尺也是风格标尺——`frames/ref_*.jpg` 就是你要的目标长相。
- **做第 2–5 套时**：**只借它的结构与节奏**（镜头怎么分、节拍怎么对、停留多长、素材怎么摆），**不借配色与光的形态**。那四套的视觉定义只看 `reference/styles/<n>-<id>.md`。拿它的青色玻璃卡去套 `compare`（浅底）会立刻崩掉。

看 `frames/overview_1..6.jpg` 通览，`frames/ref_*.jpg` 看单帧细节。

| 文件 | 说明 |
|---|---|
| `research.md` | 调研文档（7900 字，105 个来源，§7 数字与比喻清单） |
| `narration.txt` | 解说词（44 句、4 章、竖线切字幕块） |
| `timeline.md` | 配音后的时间轴（句/块帧号） |
| `storyboard_src.md` / `分镜表.md` | 分镜源（令牌）与填帧后的成品 |
| `AGENT_RAG_BUILD_RULES.md` / `AGENT_RAG_QC_RULES.md` | 本片实际使用的构建/QC 协议（**历史快照**，写于五套风格整合之前，里面的紫色/黑底是第 1 套的取值；现行协议看 `reference/agent-build-rules.md` / `agent-qc-rules.md`） |
| `qc/` | v1 四章 QC 报告 + v3 终检报告（可看问题长什么样、怎么量化） |
| `shots_src/G1..G8/` | 44 个镜头源码 + 各组 BUILD_NOTES（参数、偏离、QC 修复记录）。import 路径是原工程的（`../../ui`、`../../common`），与模板一致可直接参考 |
| `ui_rag.tsx` | 本片图元库（模板 `src/ui.tsx` 即由此演化） |
| `交付说明.md` | 交付文档范例 |
