---
title: "灯火CMS"
titleEn: "Tomoshibi CMS"
year: 2023
roles: ["バックエンド設計", "実装"]
stack: ["TypeScript", "Cloudflare Workers"]
summary: "更新頻度の低い小規模サイト向けに、管理画面を持たないヘッドレスCMS。"
thumbnail: "./images/tomoshibi-cms-thumb.svg"
cover: "./images/tomoshibi-cms-cover.svg"
order: 6
---

年に数回しか更新しないサイトのために、常時稼働する管理画面とデータベースを維持するのは過剰だと感じていた。
灯火CMSはリポジトリ内のMarkdownファイルを唯一の情報源とし、編集はGit経由、公開はプルリクエストのマージのみで完結する。

管理画面を作らないという判断そのものが設計であり、「機能を足さないことで運用コストを削る」という考え方の実験でもあった。
