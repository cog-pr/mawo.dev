---
title: "しずくプレイヤー"
titleEn: "Shizuku Player"
year: 2025
roles: ["プロダクト設計", "実装"]
stack: ["TypeScript", "Web Audio API"]
summary: "雨音のような環境音を、和音進行に合わせてリアルタイム生成する作業用BGMプレイヤー。"
thumbnail: "./images/shizuku-player-thumb.svg"
cover: "./images/shizuku-player-cover.svg"
order: 3
---

作業用BGMとして雨音を流すサービスは多いが、ループの繋ぎ目が耳につくものが大半だった。
しずくプレイヤーは固定の音源ファイルを使わず、Web Audio API 上で粒子合成的に水滴音を生成し続けることで、理論上ループしない環境音を実現している。

背後には緩やかな和音進行のシーケンサーがあり、水滴の発生確率と音高がそれに追従する。
派手な機能を足すのではなく、鳴らしっぱなしにしても疲れない音量設計と減衰カーブの調整に開発時間の大半を使った。
