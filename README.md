# pubmed-ai-screening
# PubMed AI Screener (文献 AI 筛选助手) 🧬

**PubMed AI Screener** 是一款专为医学研究人员、学生及系统评价（Systematic Review）撰写者设计的智能工具。它利用 Google Gemini AI 的强大理解能力，自动解析从 PubMed 导出的文献记录，并根据您自定义的入排标准（Inclusion/Exclusion Criteria）进行自动化初步筛选。

---

## ✨ 核心功能

- **🚀 智能筛选**：自动阅读题目和摘要，判断文献是否符合您的研究标准。
- **🔍 联网增强 (Google Search Grounding)**：支持调用 Google 搜索补全摘要信息缺失的文献（需使用 Pro 模型）。
- **📑 多格式解析**：完美支持 PubMed 导出的 `Abstract` (段落式) 和 `PubMed` (标签式) `.txt` 文件。
- **📊 逐条判定理由**：AI 不仅给出“纳入/排除”结论，还会针对每一条标准给出具体的通过或拒绝理由。
- **📥 数据导出**：一键将筛选结果（含结论与理由）导出为 CSV 表格，方便导入 EndNote 或 Excel。
- **🎨 现代化 UI**：清爽的响应式设计，支持实时进度监控。

---

## 🛠️ 技术栈

- **Frontend**: React 19 (Hooks, useMemo)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **AI Engine**: Google Gemini API (`@google/genai`)
  - `gemini-3-flash-preview`: 极速筛选，适合大批量文献。
  - `gemini-3-pro-preview`: 深度推理，支持联网搜索，适合疑难文献。

---

## 📖 使用指南

### 第一步：从 PubMed 导出数据
为了确保解析成功，请务必按照以下步骤在 [PubMed](https://pubmed.ncbi.nlm.nih.gov/) 导出：
1. 进行您的检索。
2. 点击页面顶部的 **Save** 按钮。
3. **Selection**: 选择 `All results` (或 `All results on this page`)。
4. **Format**: **关键步骤！** 请务必选择 `Abstract` 或 `PubMed` 格式。
5. 点击 **Create file** 保存 `.txt` 文件。

### 第二步：导入与配置
1. 打开应用，点击上传区域导入下载的 `.txt` 文件。
2. 在左侧边栏配置您的 **纳入标准 (Inclusion)** 和 **排除标准 (Exclusion)**。
3. 选择合适的 AI 模型。如果您需要 AI 联网检查文献的最新信息，请开启 **Enhanced Web Search** 并选择 Pro 模型。

### 第三步：开始筛选
1. 点击 **Start Screening**。
2. 观察实时进度条。您可以随时点击列表中的文献查看详细的 AI 判定逻辑。
3. 筛选完成后，点击底部的 **Export CSV** 下载结果。
---
## ⚠️ 注意事项
- **API 密钥**：本应用需要有效的 `API_KEY` 环境变量方可运行。
- **AI 辅助决策**：AI 的判定结果仅供初步筛选参考，建议研究者对“纳入”和“不确定”的文献进行二次人工复核。
- **隐私**：应用仅将文献的标题、摘要及 DOI 发送至 Gemini 进行分析，不存储您的任何私密数据。

---
## 🤝 贡献与反馈

如果您在使用过程中遇到任何问题或有改进建议，欢迎随时反馈！

