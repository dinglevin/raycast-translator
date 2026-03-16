import CryptoJS from "crypto-js";

export function generateSign(
  appKey: string,
  query: string,
  salt: string,
  appSecret: string
): string {
  const str = appKey + query + salt + appSecret;
  return CryptoJS.MD5(str).toString();
}

export function generateSalt(): string {
  return Math.floor(Math.random() * 10000).toString();
}
