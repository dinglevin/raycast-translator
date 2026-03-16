import { execSync } from "child_process";
import { tmpdir } from "os";
import { join } from "path";
import { existsSync, unlinkSync, statSync } from "fs";

/**
 * 使用 afplay 播放有道在线发音
 * @param word 要发音的单词或句子
 * @param type 发音类型：us (美音) 或 uk (英音)
 */
export async function playPronunciation(word: string, type: 'us' | 'uk' = 'us'): Promise<void> {
  const voiceType = type === 'us' ? 1 : 2;
  const url = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=${voiceType}`;

  // 生成临时文件路径
  const tempFile = join(tmpdir(), `youdao_pronunciation_${Date.now()}.mp3`);

  try {
    // 使用 curl 下载音频文件，添加 User-Agent 和跟随重定向
    execSync(
      `curl -L -A "Mozilla/5.0" -s -o "${tempFile}" "${url}"`,
      { timeout: 30000 }
    );

    // 检查文件是否下载成功
    if (!existsSync(tempFile)) {
      throw new Error('Failed to download audio file');
    }

    // 检查文件大小（至少 1KB）
    const stats = statSync(tempFile);
    if (stats.size < 1000) {
      throw new Error('Downloaded file is too small');
    }

    // 播放音频
    execSync(`afplay "${tempFile}"`, { timeout: 15000 });
  } catch (error) {
    console.error('Pronunciation playback failed:', error);
    throw error;
  } finally {
    // 清理临时文件
    try {
      if (existsSync(tempFile)) {
        unlinkSync(tempFile);
      }
    } catch {
      // 忽略清理错误
    }
  }
}

/**
 * 使用 macOS say 命令发音
 * @param word 要发音的单词或句子
 */
export async function playPronunciationWithSay(word: string): Promise<void> {
  try {
    execSync(`say "${word}"`, { timeout: 10000 });
  } catch (error) {
    console.error('Say pronunciation failed:', error);
    throw error;
  }
}

/**
 * 检查 afplay 是否可用
 */
export function isAfplayAvailable(): boolean {
  try {
    execSync('which afplay', { encoding: 'utf-8' });
    return true;
  } catch {
    return false;
  }
}