---
title: "なぜ Cloudflare Pages ではなく Workers か"
date: 2026-08-10
decision: "ホスティングを Cloudflare Workers（Static Assets）にする。当初予定していた Pages は採用しない。"
alternatives:
  - option: "Cloudflare Pages"
    why_not: "このサイトは完全な静的出力なので Pages でも過不足なく動く。設定ファイルすら要らない点はむしろ優れている。ただし Cron Triggers、Queue、Workers Logs、Email Workers、非ルートパスへの配信などが Pages では使えず、後から必要になった時点で移行作業が発生する。"
  - option: "Vercel / Netlify などの静的ホスティング"
    why_not: "配信品質に不満はないが、独自ドメインとDNSを既に Cloudflare で持っているため、事業者を分けると管理点が増える。分ける利点が見つからなかった。"
  - option: "GitHub Pages"
    why_not: "無料で単純だが、エッジ配信の品質と設定の自由度（ヘッダー、リダイレクト、将来の動的処理）で劣る。"
verdict: "静的配信の結果は Pages と Workers で変わらない。差が出るのは『後で動的処理が必要になったとき』だけで、そのとき移行コストを払うくらいなら、等価な今のうちに広いほうを選んでおく。支払う代償は wrangler.jsonc 一枚。"
---

当初の仕様では Pages を指定していた。理由は「静的配信で十分。エッジ配信が速い」で、これは事実として正しい。実際このサイトは SSR も API も持たないため、Pages で何も困らない。

見直したきっかけは「なぜ Pages なのか」という問い自体だった。調べ直したところ、判断材料が当初と変わっていた。

まず、Cloudflare は Pages を非推奨にしていない。ドキュメントに廃止の告知はなく、現役のプロダクトとして扱われている。一方で移行ガイドには「Unlike Pages, Workers has a distinctly broader set of features available to it」とあり、機能面では Workers がほぼ上位互換である。

そして Pages の実質的な優位だった Git 連携とプルリクエストごとのプレビューデプロイは、Workers Builds が同等に提供するようになった。ここで差がなくなった。

残る違いは `wrangler.jsonc` を1つ置くかどうかだけになる。この状態で「今は要らないから狭いほうでいい」と判断する理由が見つからなかった。

なお、この判断は速度のためではない。静的ファイルを配る限り両者の配信結果は同じで、Lighthouse の数値も変わらない。選んでいるのは性能ではなく、将来の選択肢の広さである。

このサイトは「機能を足さないこと」を繰り返し選んできたが、それは**動くものを増やさない**という意味であって、**選べる余地を捨てる**という意味ではない。前者はコストを減らすが、後者は将来のコストを増やす。
