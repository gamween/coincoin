/// <reference types="vite/client" />

interface ImportMetaEnv {
  /// RulesEngineV1 address on the target chain — enables the dashboard firewall controls.
  readonly VITE_RULES_ENGINE?: `0x${string}`;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
