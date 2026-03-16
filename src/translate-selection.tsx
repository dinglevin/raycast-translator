import { useState, useEffect, useMemo } from "react";
import {
  List,
  ActionPanel,
  Action,
  getPreferenceValues,
  Icon,
  showToast,
  Toast,
  getSelectedText,
  Clipboard,
} from "@raycast/api";
import { TranslateResult, YoudaoConfig, ResultCategory } from "./types";
import { translate } from "./utils/youdao-api";
import { camelCaseToSpaceCase } from "./utils/language";
import { playPronunciation, playPronunciationWithSay } from "./utils/pronunciation";

interface Preferences {
  appKey: string;
  appSecret: string;
}

const CATEGORY_ICONS: Record<ResultCategory, Icon> = {
  translation: Icon.Text,
  basic: Icon.Book,
  phonetic: Icon.SpeakerOn,
  web: Icon.Globe,
};

const CATEGORY_TITLES: Record<ResultCategory, string> = {
  translation: "翻译结果",
  basic: "基本释义",
  phonetic: "音标",
  web: "网络释义",
};

interface GroupedResults {
  translation: TranslateResult[];
  basic: TranslateResult[];
  phonetic: TranslateResult[];
  web: TranslateResult[];
}

function groupResults(results: TranslateResult[]): GroupedResults {
  const grouped: GroupedResults = {
    translation: [],
    basic: [],
    phonetic: [],
    web: [],
  };

  results.forEach((result) => {
    grouped[result.category].push(result);
  });

  return grouped;
}

function ResultItem({ result }: { result: TranslateResult }) {
  const handlePlayPronunciation = async () => {
    if (result.copyText === "error") return;
    try {
      await playPronunciation(result.pronounceText, 'us');
    } catch {
      // 如果发音失败，静默使用 macOS say 作为备选
      await playPronunciationWithSay(result.pronounceText);
    }
  };

  const handlePlayUkPronunciation = async () => {
    if (result.copyText === "error") return;
    try {
      await playPronunciation(result.pronounceText, 'uk');
    } catch {
      // 如果发音失败，静默使用 macOS say 作为备选
      await playPronunciationWithSay(result.pronounceText);
    }
  };

  return (
    <List.Item
      title={result.title}
      subtitle={result.subtitle}
      accessories={result.phonetic ? [{ text: result.phonetic }] : undefined}
      icon={CATEGORY_ICONS[result.category]}
      actions={
        <ActionPanel>
          <Action.CopyToClipboard
            title="复制结果"
            content={result.copyText}
          />
          <Action
            title="播放美音发音"
            icon={Icon.SpeakerOn}
            onAction={handlePlayPronunciation}
            shortcut={{ modifiers: ["ctrl"], key: "enter" }}
          />
          <Action
            title="播放英音发音"
            icon={Icon.SpeakerOn}
            onAction={handlePlayUkPronunciation}
            shortcut={{ modifiers: ["ctrl", "shift"], key: "p" }}
          />
          <Action.OpenInBrowser
            title="词典网页查看"
            url={result.webUrl}
            shortcut={{ modifiers: ["shift"], key: "enter" }}
          />
          <Action.CopyToClipboard
            title="复制发音文本"
            content={result.pronounceText}
            shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
          />
        </ActionPanel>
      }
    />
  );
}

export default function TranslateSelectionCommand() {
  const [results, setResults] = useState<TranslateResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedText, setSelectedText] = useState<string>("");
  const preferences = getPreferenceValues<Preferences>();

  const config = useMemo<YoudaoConfig>(
    () => ({
      appKey: preferences.appKey,
      appSecret: preferences.appSecret,
    }),
    [preferences.appKey, preferences.appSecret]
  );

  useEffect(() => {
    async function fetchSelectedText() {
      try {
        const text = await getSelectedText();
        if (text && text.trim()) {
          setSelectedText(text.trim());
          await performTranslate(text.trim(), config);
        } else {
          await showToast({
            style: Toast.Style.Failure,
            title: "未选中文字",
            message: "请先选中要翻译的文字",
          });
        }
      } catch (error) {
        await showToast({
          style: Toast.Style.Failure,
          title: "获取选中文字失败",
          message: error instanceof Error ? error.message : "未知错误",
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchSelectedText();
  }, [config]);

  async function performTranslate(searchText: string, currentConfig: YoudaoConfig) {
    setIsLoading(true);

    try {
      const processedQuery = camelCaseToSpaceCase(searchText);
      const translationResults = await translate(processedQuery, currentConfig);
      setResults(translationResults);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "翻译失败";
      await showToast({
        style: Toast.Style.Failure,
        title: "翻译失败",
        message: errorMessage,
      });
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }

  const grouped = groupResults(results);

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder={selectedText || "正在获取选中文字..."}
      navigationTitle={`翻译: ${selectedText.slice(0, 50)}${selectedText.length > 50 ? '...' : ''}`}
    >
      {results.length === 0 && !isLoading && selectedText && (
        <List.EmptyView
          icon={Icon.Text}
          title="暂无结果"
          description="请输入单词或句子进行翻译"
        />
      )}

      {results.length === 0 && !isLoading && !selectedText && (
        <List.EmptyView
          icon={Icon.Text}
          title="未选中文字"
          description="请先选中要翻译的文字，然后重新运行此命令"
        />
      )}

      {grouped.translation.length > 0 && (
        <List.Section title={CATEGORY_TITLES.translation}>
          {grouped.translation.map((result, index) => (
            <ResultItem key={`trans-${index}`} result={result} />
          ))}
        </List.Section>
      )}

      {grouped.basic.length > 0 && (
        <List.Section title={CATEGORY_TITLES.basic}>
          {grouped.basic.map((result, index) => (
            <ResultItem key={`basic-${index}`} result={result} />
          ))}
        </List.Section>
      )}

      {grouped.phonetic.length > 0 && (
        <List.Section title={CATEGORY_TITLES.phonetic}>
          {grouped.phonetic.map((result, index) => (
            <ResultItem key={`phonetic-${index}`} result={result} />
          ))}
        </List.Section>
      )}

      {grouped.web.length > 0 && (
        <List.Section title={CATEGORY_TITLES.web}>
          {grouped.web.map((result, index) => (
            <ResultItem key={`web-${index}`} result={result} />
          ))}
        </List.Section>
      )}
    </List>
  );
}