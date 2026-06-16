# Security Policy

coincoin is an **experimental, unaudited research prototype on testnet**. Do not use it with funds at risk.

## Reporting a vulnerability

Please report security issues **privately** — do not open a public issue or PR.

Contact: [X (@dvb_fianso)](https://x.com/dvb_fianso) or [Telegram (@dvb_fianso)](https://t.me/dvb_fianso).

We'll acknowledge the report, work on a fix, and coordinate disclosure before anything is made public.

## Scope

- `contracts/` — `GuardianModule` (EIP-7702 delegate), `RulesEngineV1` (firewall), `SafeVault`
- `watcher/` — the detection daemon and bounded keeper

Known limitations and the trust model are documented in the [README](README.md#security--trust-model).
