# Translator for Raycast

Raycast 翻译插件实现，当前使用有道智云 API，后续可以扩展到其他 API 接入。

## 功能特性

### 核心功能

- **多语言自动检测** - 支持中文、英文、日文、韩文、法文、俄文自动识别
- **智能翻译方向** - 中文自动翻译为英文，其他语言翻译为中文
- **实时翻译** - 输入时自动翻译，600ms 防抖优化体验
- **驼峰命名转换** - 自动将 CamelCase 转换为空格分隔便于翻译

### 结果展示

翻译结果分组展示，信息更清晰：

- **翻译结果** - 主要翻译内容
- **基本释义** - 单词/词组的基本含义
- **音标** - 美式/英式音标（适用于英文单词）
- **网络释义** - 来自网络的翻译参考

### 快捷操作

- `Enter` - 复制翻译结果到剪贴板
- `Ctrl+Enter` - 播放美音发音
- `Ctrl+Shift+P` - 播放英音发音
- `Shift+Enter` - 在有道词典网页查看
- `Cmd+Shift+C` - 复制发音文本

### 命令

| 命令                 | 说明                       |
| -------------------- | -------------------------- |
| `Translate`          | 输入单词或句子进行翻译     |
| `Translate Selection` | 翻译当前选中的文字         |

## 安装

### 前置要求

- Node.js 18+
- npm 或 yarn
- Raycast 应用

### 安装步骤

```bash
# 克隆仓库
git clone https://github.com/dinglevin/raycast-translator.git
cd raycast-translator

# 安装依赖
npm install

# 构建
npm run build
```

然后在 Raycast 中导入扩展目录。

## 配置

### 获取有道智云 API 密钥

1. 访问 [有道智云](https://ai.youdao.com/) 注册账号
2. 创建应用，获取 **App Key** 和 **App Secret**
3. 开通「文本翻译」服务
4. 在 Raycast 扩展偏好设置中填入凭证

### 配置步骤

1. 打开 Raycast
2. 进入 Extensions → Translator
3. 点击 Configure Extension
4. 填入 App Key 和 App Secret

## 项目结构

```shell
raycast-translator/
├── src/
│   ├── translate.tsx          # 主翻译命令
│   ├── translate-selection.tsx # 选中翻译命令
│   ├── types.ts               # TypeScript 类型定义
│   └── utils/
│       ├── youdao-api.ts      # 有道 API 调用
│       ├── pronunciation.ts   # 发音功能
│       ├── language.ts        # 语言检测
│       └── sign.ts            # API 签名生成
├── assets/
│   └── command-icon.png       # 命令图标
├── package.json               # 项目配置
└── README.md
```

## 技术实现

### API 使用

- **有道智云翻译 API** - 主要翻译服务，需要认证
- **有道公开词典 API** - 补充音标、释义等词典数据

### 语言检测

基于 Unicode 字符范围进行本地检测：

- 中文：`\u4e00-\u9fa5`
- 日文：`\u3040-\u309F` (平假名) / `\u30A0-\u30FF` (片假名)
- 韩文：`\uAC00-\uD7AF`
- 俄文：`\u0400-\u04FF`
- 法文：法语特有字符

### 发音功能

优先使用有道在线发音，通过 `afplay` 播放 MP3；失败时回退到 macOS `say` 命令。

## 支持的语言

| 语言 | 翻译方向      |
| ---- | ------------- |
| 中文 | 中文 → 英文   |
| 英文 | 英文 → 中文   |
| 日文 | 日文 → 中文   |
| 韩文 | 韩文 → 中文   |
| 法文 | 法文 → 中文   |
| 俄文 | 俄文 → 中文   |

## 开发

```bash
# 开发模式
npm run dev

# 构建
npm run build

# 代码检查
npm run lint

# 自动修复
npm run fix-lint
```

## 技术栈

- [Raycast API](https://developers.raycast.com/) - Raycast 扩展开发框架
- TypeScript - 类型安全
- React - UI 组件
- 有道智云 API - 翻译服务

## 致谢

- 原作者 [wensonsmith](https://github.com/wensonsmith) 的 Alfred Workflow 实现
- [Raycast](https://raycast.com/) 提供的优秀扩展平台

## License

Apache License 2.0
