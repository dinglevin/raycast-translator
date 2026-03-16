import { showToast, Toast } from "@raycast/api";
import { YoudaoConfig, TranslateResult, YoudaoApiResponse, YoudaoDictResponse, ErrorCodeMessages, ResultCategory } from "../types";
import { generateSign, generateSalt } from "./sign";
import { detectLanguage, getTranslationDirection } from "./language";

// 构建有道智云翻译 API URL
function buildTranslateUrl(word: string, config: YoudaoConfig): string {
  const salt = generateSalt();
  const sign = generateSign(config.appKey, word, salt, config.appSecret);
  const lang = detectLanguage(word);
  const { from, to } = getTranslationDirection(lang);

  const params = new URLSearchParams({
    q: word,
    from,
    to,
    appKey: config.appKey,
    salt,
    sign,
  });

  return `https://openapi.youdao.com/api?${params.toString()}`;
}

// 构建有道公开词典 API URL
function buildDictUrl(word: string): string {
  return `https://dict.youdao.com/jsonapi?q=${encodeURIComponent(word)}`;
}

function createResult(
  category: ResultCategory,
  title: string,
  subtitle: string,
  copyText: string,
  pronounceText: string,
  webUrl: string,
  phonetic?: string
): TranslateResult {
  return {
    category,
    title,
    subtitle,
    copyText,
    pronounceText,
    phonetic,
    webUrl,
  };
}

// 从有道公开词典 API 解析音标
function parseDictPhonetic(dictData: YoudaoDictResponse): string {
  const word = dictData.simple?.word?.[0];
  if (!word) return "";

  let phonetic = "";
  if (word.usphone) {
    phonetic += `[美: ${word.usphone}] `;
  }
  if (word.ukphone) {
    phonetic += `[英: ${word.ukphone}]`;
  }
  return phonetic.trim();
}

// 从有道公开词典 API 解析基本释义
function parseDictExplains(dictData: YoudaoDictResponse): string[] {
  const explains: string[] = [];
  const words = dictData.ec?.word;

  if (words && words.length > 0) {
    words.forEach((w) => {
      if (w.trs) {
        w.trs.forEach((trsItem) => {
          if (trsItem.tr) {
            trsItem.tr.forEach((trItem) => {
              const meanings = trItem.l?.i;
              if (meanings && Array.isArray(meanings)) {
                meanings.forEach((meaning) => {
                  if (meaning) {
                    explains.push(meaning);
                  }
                });
              }
            });
          }
        });
      }
    });
  }

  return explains;
}

// 从有道公开词典 API 解析网络释义
function parseDictWebTrans(dictData: YoudaoDictResponse): Array<{ key: string; value: string }> {
  const webTrans: Array<{ key: string; value: string }> = [];
  const translations = dictData.web_trans?.["web-translation"];

  if (translations && translations.length > 0) {
    translations.forEach((item) => {
      if (item.trans && item.trans.length > 0) {
        const values = item.trans
          .map((t) => t.value)
          .filter((v): v is string => !!v);
        if (values.length > 0) {
          webTrans.push({
            key: item.trans[0]?.value || "",
            value: values.join(", "),
          });
        }
      }
    });
  }

  return webTrans.slice(0, 5); // 限制数量
}

// 从有道公开词典 API 解析词组
function parseDictPhrases(dictData: YoudaoDictResponse): Array<{ phrase: string; meaning: string }> {
  const phrases: Array<{ phrase: string; meaning: string }> = [];
  const phrsList = dictData.phrs?.phrs;

  if (phrsList && phrsList.length > 0) {
    phrsList.slice(0, 5).forEach((phrItem) => {
      const phrase = phrItem.phr?.headword?.l?.i;
      const meanings = phrItem.phr?.trs?.[0]?.tr?.l?.i;
      if (phrase && meanings) {
        phrases.push({ phrase, meaning: meanings });
      }
    });
  }

  return phrases;
}

export async function translate(word: string, config: YoudaoConfig): Promise<TranslateResult[]> {
  if (!word.trim()) {
    return [];
  }

  // 检查配置
  if (!config.appKey || !config.appSecret) {
    console.error("Missing API credentials");
    return [
      createResult(
        'translation',
        "⚠️ 未配置 API 密钥",
        "请在 Raycast 偏好设置中配置 App Key 和 App Secret",
        "error",
        "error",
        `https://www.youdao.com/w/${encodeURIComponent(word)}`
      ),
    ];
  }

  try {
    const lang = detectLanguage(word);
    const isChinese = lang === 'zh';
    const webUrl = `https://www.youdao.com/w/${encodeURIComponent(word)}`;

    // 并行请求翻译 API 和词典 API
    const translateUrl = buildTranslateUrl(word, config);
    const dictUrl = buildDictUrl(word);

    console.log("Translate URL:", translateUrl);
    console.log("Dict URL:", dictUrl);

    const [translateResponse, dictResponse] = await Promise.all([
      fetch(translateUrl),
      fetch(dictUrl),
    ]);

    const translateData = (await translateResponse.json()) as YoudaoApiResponse;
    const dictData = (await dictResponse.json()) as YoudaoDictResponse;

    console.log("Translate Response:", translateData);
    console.log("Dict Response keys:", Object.keys(dictData));

    if (translateData.errorCode !== "0") {
      const errorMessage = ErrorCodeMessages[translateData.errorCode] || `错误码：${translateData.errorCode}`;
      await showToast({
        style: Toast.Style.Failure,
        title: "翻译出错",
        message: errorMessage,
      });
      return [
        createResult(
          'translation',
          "👻 翻译出错啦",
          errorMessage,
          "error",
          "error",
          webUrl
        ),
      ];
    }

    const results: TranslateResult[] = [];

    // 1. 解析翻译结果
    if (translateData.translation && translateData.translation.length > 0) {
      translateData.translation.forEach((t) => {
        const pronounceText = isChinese ? t : word;
        results.push(
          createResult(
            'translation',
            t,
            isChinese ? "中文 → 英文" : "英文 → 中文",
            t,
            pronounceText,
            webUrl
          )
        );
      });
    }

    // 2. 解析基本释义（优先使用智云 API，如果没有则使用公开词典 API）
    const basicExplains = translateData.basic?.explains || parseDictExplains(dictData);
    if (basicExplains.length > 0) {
      basicExplains.forEach((explain) => {
        const pronounceText = isChinese ? explain : word;
        results.push(
          createResult(
            'basic',
            explain,
            "基本释义",
            explain,
            pronounceText,
            webUrl
          )
        );
      });
    }

    // 3. 解析音标
    const phoneticFromApi = translateData.basic
      ? (translateData.basic["us-phonetic"] || translateData.basic["uk-phonetic"])
        ? `${translateData.basic["us-phonetic"] ? `[美: ${translateData.basic["us-phonetic"]}] ` : ""}${translateData.basic["uk-phonetic"] ? `[英: ${translateData.basic["uk-phonetic"]}]` : ""}`.trim()
        : ""
      : "";

    const phonetic = phoneticFromApi || parseDictPhonetic(dictData);
    if (phonetic) {
      const pronounceText = isChinese ? translateData.translation?.[0] || word : word;
      results.push(
        createResult(
          'phonetic',
          phonetic,
          "音标",
          pronounceText,
          pronounceText,
          webUrl,
          phonetic
        )
      );
    }

    // 4. 解析网络释义
    const webData = translateData.web;
    if (webData && webData.length > 0) {
      webData.forEach((item) => {
        const pronounceText = isChinese ? item.value[0] : item.key;
        results.push(
          createResult(
            'web',
            item.value.join(", "),
            `网络释义: ${item.key}`,
            item.value[0],
            pronounceText,
            webUrl
          )
        );
      });
    } else {
      // 使用公开词典 API 的网络翻译
      const dictWebTrans = parseDictWebTrans(dictData);
      dictWebTrans.forEach((item) => {
        results.push(
          createResult(
            'web',
            item.value,
            "网络释义",
            item.key,
            item.key,
            webUrl
          )
        );
      });
    }

    // 5. 解析词组
    const phrases = parseDictPhrases(dictData);
    if (phrases.length > 0) {
      phrases.forEach((p) => {
        results.push(
          createResult(
            'web',
            p.meaning,
            `词组: ${p.phrase}`,
            p.meaning,
            p.phrase,
            webUrl
          )
        );
      });
    }

    return results;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "未知错误";
    await showToast({
      style: Toast.Style.Failure,
      title: "请求失败",
      message: errorMessage,
    });
    return [
      createResult(
        'translation',
        "👻 请求失败",
        errorMessage,
        "error",
        "error",
        `https://www.youdao.com/w/${encodeURIComponent(word)}`
      ),
    ];
  }
}