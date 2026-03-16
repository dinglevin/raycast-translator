# 有道翻译 Raycast 插件功能完善设计

## 概述

本项目旨在完善 raycast-youdao-translator 插件，使其达到原版 Alfred Workflow (wensonsmith/YoudaoTranslator) 的核心功能水平。

## 当前问题

### 1. 发音功能不完整
- **现状**：通过 `Action.OpenInBrowser` 打开浏览器播放发音
- **问题**：体验差，需要额外操作，会跳出 Raycast
- **目标**：直接在 Raycast 内播放发音

### 2. 仅支持中英互译
- **现状**：`detectChinese` 只检测中文，翻译方向固定为 `zh↔en`
- **问题**：不支持日/韩/法/俄等其他语言
- **目标**：支持多语言自动检测和翻译

### 3. 翻译结果展示不完整
- **现状**：句子翻译时只显示一条 translation 结果
- **问题**：缺少基本释义、网络释义的完整展示
- **目标**：优化结果分组和展示

### 4. 缺少快捷翻译选中内容
- **现状**：需要手动打开命令输入
- **目标**：支持翻译选中文字

## 设计方案

### 1. 发音功能改进

使用 macOS 系统自带的 `afplay` 命令直接播放有道在线语音：

```typescript
async function playPronunciation(word: string, type: 'us' | 'uk' = 'us'): Promise<void> {
  const voiceType = type === 'us' ? 1 : 2;
  const url = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=${voiceType}`;
  await execAsync(`afplay '${url}'`);
}
```

**操作方式**：
- `Cmd+Enter` - 播放美音发音
- `Cmd+Shift+P` - 播放英音发音

### 2. 多语言支持

扩展语言检测和翻译方向：

| 检测语言 | 翻译方向 | 正则表达式 |
|----------|----------|------------|
| 中文 | zh→en | `[\u4e00-\u9fa5]` |
| 日文 | ja→zh | `[\u3040-\u309F\u30A0-\u30FF]` |
| 韩文 | ko→zh | `[\uAC00-\uD7AF]` |
| 法文 | fr→zh | 拉丁字母 + 法语特征词 |
| 俄文 | ru→zh | `[\u0400-\u04FF]` |
| 英文/其他 | auto→zh | 默认 |

```typescript
type Language = 'zh' | 'en' | 'ja' | 'ko' | 'fr' | 'ru' | 'auto';

function detectLanguage(text: string): Language {
  if (/[\u4e00-\u9fa5]/.test(text)) return 'zh';
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return 'ja';
  if (/[\uAC00-\uD7AF]/.test(text)) return 'ko';
  if (/[\u0400-\u04FF]/.test(text)) return 'ru';
  // 法语检测（包含 é, è, ê, ë, à, â, etc.）
  if (/[àâäéèêëïîôùûüç]/i.test(text)) return 'fr';
  return 'en';
}

function getTranslationDirection(lang: Language): { from: string; to: string } {
  if (lang === 'zh') return { from: 'zh-CHS', to: 'en' };
  return { from: 'auto', to: 'zh-CHS' };
}
```

### 3. 结果展示优化

重新设计 `TranslateResult` 类型和展示逻辑：

```typescript
interface TranslateResult {
  // 分类：translation | basic | phonetic | web
  category: 'translation' | 'basic' | 'phonetic' | 'web';

  // 主标题
  title: string;

  // 副标题
  subtitle: string;

  // 可复制内容
  copyText: string;

  // 发音文本
  pronounceText: string;

  // 音标（仅 phonetic 类型）
  phonetic?: string;

  // 网页查看 URL
  webUrl: string;
}
```

**分组展示**：
- 翻译结果 - 主翻译文本
- 基本释义 - `basic.explains` 数组
- 音标 - 英/美音标
- 网络释义 - `web` 数组

### 4. 选中内容翻译

添加新的命令 `translate-selection`：

```json
{
  "name": "translate-selection",
  "title": "Translate Selection",
  "subtitle": "Youdao",
  "description": "翻译选中的文字",
  "mode": "view"
}
```

使用 Raycast 的 `getSelectedText()` API 获取选中内容。

## 文件结构

```
src/
├── translate.tsx           # 主翻译命令（重构）
├── translate-selection.tsx # 选中内容翻译（新增）
├── types.ts               # 类型定义（更新）
└── utils/
    ├── language.ts        # 语言检测（扩展）
    ├── pronunciation.ts   # 发音功能（新增）
    ├── sign.ts           # API 签名（不变）
    └── youdao-api.ts     # API 调用（重构）
```

## 实施步骤

1. [x] 分析当前代码和原版功能差异
2. [ ] 扩展多语言检测功能
3. [ ] 实现发音功能（afplay）
4. [ ] 重构结果解析和展示
5. [ ] 添加选中内容翻译命令
6. [ ] 测试和优化

## 兼容性

- macOS 10.15+ (Catalina)
- Raycast 1.64.0+
- 需要有道智云 API 密钥