import { useState, useEffect, useCallback, useMemo } from "react";
import {
  List,
  ActionPanel,
  Action,
  getPreferenceValues,
  Icon,
  showToast,
  Toast,
} from "@raycast/api";
import { TranslateResult, YoudaoConfig, ResultCategory } from "./types";
import { translate } from "./utils/youdao-api";
import { camelCaseToSpaceCase } from "./utils/language";
import { playPronunciation, playPronunciationWithSay } from "./utils/pronunciation";

interface Preferences {
  appKey: string;
  appSecret: string;
}

const DEBOUNCE_MS = 600;

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
  const handlePlayPronunciation = useCallback(async () => {
    if (result.copyText === "error") return;
    try {
      await playPronunciation(result.pronounceText, 'us');
    } catch {
      // 如果发音失败，静默使用 macOS say 作为备选
      await playPronunciationWithSay(result.pronounceText);
    }
  }, [result]);

  const handlePlayUkPronunciation = useCallback(async () => {
    if (result.copyText === "error") return;
    try {
      await playPronunciation(result.pronounceText, 'uk');
    } catch {
      // 如果发音失败，静默使用 macOS say 作为备选
      await playPronunciationWithSay(result.pronounceText);
    }
  }, [result]);

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

export default function Command() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TranslateResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const preferences = getPreferenceValues<Preferences>();

  const config = useMemo<YoudaoConfig>(
    () => ({
      appKey: preferences.appKey,
      appSecret: preferences.appSecret,
    }),
    [preferences.appKey, preferences.appSecret]
  );

  const performTranslate = useCallback(
    async (searchText: string, currentConfig: YoudaoConfig) => {
      if (!searchText.trim()) {
        setResults([]);
        return;
      }

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
    },
    []
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      performTranslate(query, config);
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query, config, performTranslate]);

  const grouped = groupResults(results);

  return (
    <List
      isLoading={isLoading}
      onSearchTextChange={setQuery}
      searchBarPlaceholder="输入要翻译的单词或句子..."
      throttle
    >
      {results.length === 0 && !isLoading && query.trim() && (
        <List.EmptyView
          icon={Icon.Text}
          title="暂无结果"
          description="请输入单词或句子进行翻译"
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