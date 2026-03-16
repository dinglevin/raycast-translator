export type Language = 'zh' | 'en' | 'ja' | 'ko' | 'fr' | 'ru' | 'auto';

/**
 * 检测文本语言类型
 */
export function detectLanguage(text: string): Language {
  // 中文检测
  if (/[\u4e00-\u9fa5]/.test(text)) return 'zh';

  // 日文检测（平假名、片假名）
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return 'ja';

  // 韩文检测（韩文字母）
  if (/[\uAC00-\uD7AF]/.test(text)) return 'ko';

  // 俄文检测（西里尔字母）
  if (/[\u0400-\u04FF]/.test(text)) return 'ru';

  // 法语检测（法语特有字符）
  if (/[àâäéèêëïîôùûüçœæ]/i.test(text)) return 'fr';

  // 默认英文
  return 'en';
}

/**
 * 检测是否包含中文
 */
export function detectChinese(text: string): boolean {
  return /[\u4e00-\u9fa5]/.test(text);
}

/**
 * 获取翻译方向
 * @param lang 检测到的语言
 * @returns from 和 to 语言代码
 */
export function getTranslationDirection(lang: Language): { from: string; to: string } {
  if (lang === 'zh') {
    return { from: 'zh-CHS', to: 'en' };
  }
  // 其他语言都翻译成中文
  return { from: 'auto', to: 'zh-CHS' };
}

/**
 * CamelCase 转空格分隔
 */
export function camelCaseToSpaceCase(text: string): string {
  return text.replace(/([A-Z])/g, ' $1').toLowerCase();
}
