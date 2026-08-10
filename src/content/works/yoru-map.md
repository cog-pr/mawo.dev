---
title: "夜の地図"
titleEn: "Yoru Map"
year: 2024
roles: ["設計", "WebGL実装"]
stack: ["OGL", "TypeScript"]
summary: "衛星夜間光データを元に、都市の光害の強さだけを可視化する地図。"
thumbnail: "./images/yoru-map-thumb.svg"
cover: "./images/yoru-map-cover.svg"
order: 5
---

一般的な地図サービスは道路や建物の情報密度が高く、「光の強さ」という一点だけを見たいときにはノイズが多い。
夜の地図は衛星夜間光データのみを入力とし、他の地理情報を一切描画しない。

大量のラスタデータをブラウザ上でなめらかに扱うため、タイルごとにテクスチャを分割してWebGL側でストリーミング読み込みする構成にした。
このサイトの背景シェーダー（光害の空）は、この制作物で得た知見を流用している。
