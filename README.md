# Youdao Translator for Raycast

基于 [wensonsmith/YoudaoTranslator](https://github.com/wensonsmith/YoudaoTranslator) 的 Raycast 插件版本，实现有道翻译功能。

## 功能特性

- 🌐 **多语言自动翻译** - 支持中文、英文、日文、韩文、法文、俄文等自动检测
- 📝 **多翻译结果展示** - 翻译结果、基本释义、音标、网络释义分组展示
- 📋 **一键复制** - 回车复制翻译结果
- 🔊 **本地发音** - 使用 afplay 直接播放有道发音，无需打开浏览器
  - `Ctrl+Enter` - 播放美音发音
  - `Ctrl+Shift+P` - 播放英音发音
- 🌐 **网页预览** - `Shift+Enter` 打开有道网页
- 🐫 **驼峰命名转换** - 自动将 CamelCase 转换为空格分隔
- ✨ **选中内容翻译** - 支持直接翻译选中的文字

## 安装

1. 克隆本仓库到本地
2. 安装依赖：`npm install`
3. 构建：`npm run build`
4. 在 Raycast 中导入扩展

## 配置

首次使用前需要配置有道智云 API 密钥：

1. 前往 [有道智云](https://ai.youdao.com/) 注册账号
2. 创建应用，获取 **App Key** 和 **App Secret**
3. 开通"文本翻译"服务
4. 在 Raycast 偏好设置中填入凭证

## 使用

### 翻译命令

1. 打开 Raycast
2. 输入 `Translate` 或 `Youdao` 找到命令
3. 输入要翻译的单词或句子
4. 使用快捷键操作：
   - `Enter` - 复制结果
   - `Ctrl+Enter` - 播放美音发音
   - `Ctrl+Shift+P` - 播放英音发音
   - `Shift+Enter` - 有道网页查看
   - `Cmd+Shift+C` - 复制发音文本

### 翻译选中内容

1. 在任意应用中选中文字
2. 打开 Raycast，运行 `Translate Selection` 命令
3. 自动翻译选中的内容

## 支持的语言

| 语言 | 翻译方向 |
|------|----------|
| 中文 | 中文 → 英文 |
| 英文 | 英文 → 中文 |
| 日文 | 日文 → 中文 |
| 韩文 | 韩文 → 中文 |
| 法文 | 法文 → 中文 |
| 俄文 | 俄文 → 中文 |

## 技术栈

- Raycast API
- TypeScript
- React
- 有道智云翻译 API
- macOS afplay (发音)

## 致谢

- 原作者 [wensonsmith](https://github.com/wensonsmith) 的 Alfred Workflow 版本
- [Raycast](https://raycast.com/) 提供的优秀扩展平台