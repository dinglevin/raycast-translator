export interface YoudaoConfig {
  appKey: string;
  appSecret: string;
}

export type ResultCategory = 'translation' | 'basic' | 'phonetic' | 'web';

export interface TranslateResult {
  category: ResultCategory;
  title: string;
  subtitle: string;
  copyText: string;
  pronounceText: string;
  phonetic?: string;
  webUrl: string;
}

export interface YoudaoApiResponse {
  errorCode: string;
  query?: string;
  translation?: string[];
  basic?: {
    phonetic?: string;
    "us-phonetic"?: string;
    "uk-phonetic"?: string;
    explains?: string[];
  };
  web?: Array<{
    key: string;
    value: string[];
  }>;
}

// 有道公开词典 API 类型
export interface YoudaoDictResponse {
  simple?: {
    word?: Array<{
      usphone?: string;
      ukphone?: string;
    }>;
  };
  ec?: {
    word?: Array<{
      trs?: Array<{
        tr?: Array<{
          l?: {
            i?: string[];
          };
        }>;
      }>;
    }>;
  };
  web_trans?: {
    "web-translation"?: Array<{
      trans?: Array<{
        value?: string;
      }>;
    }>;
  };
  phrs?: {
    phrs?: Array<{
      phr?: {
        headword?: {
          l?: {
            i?: string;
          };
        };
        trs?: Array<{
          tr?: {
            l?: {
              i?: string;
            };
          };
        }>;
      };
    }>;
  };
}

export const ErrorCodeMessages: Record<string, string> = {
  "101": "缺少必填的参数",
  "102": "不支持的语言类型",
  "103": "翻译文本过长",
  "108": "应用ID无效",
  "110": "无相关服务的有效实例",
  "111": "开发者账号无效",
  "112": "请求服务无效",
  "113": "查询为空",
  "202": "签名检验失败,检查 KEY 和 SECRET",
  "401": "账户已经欠费",
  "411": "访问频率受限",
};
