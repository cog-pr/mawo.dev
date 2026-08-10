---
title: "街灯アナリティクス"
titleEn: "Gaitou Analytics"
year: 2023
roles: ["フルスタック実装"]
stack: ["TypeScript", "D1", "Astro"]
summary: "個人ブログ向けに、訪問者を個体追跡せず集計だけを行う軽量アクセス解析。"
thumbnail: "./images/gaitou-analytics-thumb.svg"
cover: "./images/gaitou-analytics-cover.svg"
order: 7
draft: true
---

Cookieを使わず、IPアドレスも保存しない前提でアクセス傾向を把握したいという要望から作った解析ツール。
サーバー側でリクエストをその場で集計してカウンタだけを更新し、個々のアクセス記録は残さない。

`draft: true` の状態で残しているのは、計測項目の見直し中であるため。公開判断はまだ保留にしている。
