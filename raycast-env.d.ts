/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** App Key - 有道智云应用ID */
  "appKey": string,
  /** App Secret - 有道智云应用密钥 */
  "appSecret": string
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `translate` command */
  export type Translate = ExtensionPreferences & {}
  /** Preferences accessible in the `translate-selection` command */
  export type TranslateSelection = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `translate` command */
  export type Translate = {}
  /** Arguments passed to the `translate-selection` command */
  export type TranslateSelection = {}
}

