# 追加グラフィックの制作記録（2026-11-12）

GitHub `main` の `ad60004` を取り込んだあと、`ART-NOTES.md` と関連する `ART-REQUESTS.md`・`MONSTER-ART-NOTES.md` の不足分を制作した。
制作中に追加された `39f783a` までの台本整理・後日譚も取り込み、その依頼の後日譚スチル5枚を追加制作した。

[画像一覧](art-delivery.html) / [全19点の生成指示・参照画像・寸法・SHA-256](art-generation-20261112.json)

## 作った素材

| 種類 | 生成原本 | 表示用 | 状態 |
|---|---|---|---|
| トウマの立ち絵 | `touma-town.png` | `touma-town-cut.png` | 既存の人物紹介から自動読込 |
| ニナの立ち絵 | `nina-town.png` | `nina-town-cut.png` | 既存の人物紹介から自動読込 |
| コハルとの結末 | `stills/ending-koharu-love.png` | `stills/web/ending-koharu-love.webp` とサムネイル | 台本への表示指定は未追加 |
| ニナから告白した結末の口づけ | `stills/ending-nina-kiss.png` | `stills/web/ending-nina-kiss.webp` とサムネイル | 同上 |
| トウマから告白した結末の夜 | `stills/ending-touma-hearth.png` | `stills/web/ending-touma-hearth.webp` とサムネイル | 同上 |
| 後日譚・門の帰り灯 | `stills/epilogue-pair-gate.png` | 同名の `web/*.webp` とサムネイル | 台本への表示指定は未追加 |
| 後日譚・玄関灯 | `stills/epilogue-pair-lamp.png` | 同上 | 同上 |
| 後日譚・コハルと台所 | `stills/epilogue-koharu-kitchen.png` | 同上 | 同上 |
| 後日譚・コハルと外套 | `stills/epilogue-koharu-coat.png` | 同上 | 同上 |
| 後日譚・つないだ毛布 | `stills/epilogue-both-blanket.png` | 同上 | 同上 |
| 灯喰い | `monsters/higui.png` | `monsters/higui-cut.png` | フィールド・戦闘への割り当ては未追加 |
| あられモチ | `monsters/arare-mochi.png` | 同名の `-cut.png` | 同上 |
| あられモチ三匹組 | `monsters/arare-mochi-trio.png` | 同名の `-cut.png` | 同上 |
| みぞれヤドカリ・凍結 | `monsters/mizore-yadokari-frozen.png` | 同名の `-cut.png` | 同上 |
| みぞれヤドカリ・融解 | `monsters/mizore-yadokari-thawed.png` | 同名の `-cut.png` | 同上 |
| こだま番人 | `monsters/kodama-guardian.png` | 同名の `-cut.png` | 同上 |
| つららコウモリ | `monsters/tsurara-bat.png` | 同名の `-cut.png` | 新しい出番は未追加 |
| ゆきうさぎ灯 | `monsters/yuki-usagi-light.png` | 同名の `-cut.png` | 同上 |
| こけ玉 | `monsters/koke-dama.png` | 同名の `-cut.png` | 同上 |

## 制作と加工

すべて組み込み `image_gen` で制作。外部の画像生成API・CLIは使っていない。
原本は未加工で保存。立ち絵と精霊は単色マゼンタ背景、スチルは背景込み。

- 顔と衣装は `faces.png`、コハルは正式版 `koharu-faces.png`、立ち絵の塗りは `koharu-town.png` を参照。
- 結末スチルの画風は `stills/ending-touma.png` と `stills/ending-both.png` を参照。登場人物は若い大人として指定。
- 精霊は `cast-atlas.png` の温かな精緻なピクセル調を参照。灯喰いは鹿・鳥の巣を引き継がず、狼と山猫の間の痩せた獣として新規制作。
- ヤドカリの融解差分は凍結原本を参照した編集。同じ湯のみの欠け、花模様、姿勢、構図を維持。

`python tools/pack_art.py` で立ち絵の透過PNG、幅1280のスチルWebPと幅400のサムネイルを作成。
精霊・魔獣の透過PNGも同じ処理に追加し、状態差分がずれないよう原寸キャンバスの位置を保持している。
立ち絵の原本は1254×1254、スチルは1672×941、精霊・魔獣の原本は1254×1254。

元の15枚のスチル、コハルの正式素材、既存の顔・歩行・戦闘画像は上書きしていない。
本編の進行・結末・精霊との遭遇条件は変更していない。

## 確認

全19点の原本と表示用27ファイルを開いて、寸法・SHA-256・透過PNGの四隅と実画像領域を確認。
ブラウザの一覧で先に制作した14枚の読み込みと、マゼンタが残らないことを確認した。
あとから追加した後日譚5枚は生成結果を目視し、原本・軽量版の寸法とハッシュを照合した。一覧への追加後のブラウザ再確認は未実施。
本編は新しい確認用の保存領域で「はじめから」→OPスキップ→導入会話を進め、トウマとニナの人物紹介が両方とも全身絵に切り替わることを確認。警告・エラーはなし。
取り込んだ台本整理に従い `node tools/build-script.cjs` で再生成後、`node --test tests/*.test.cjs` は108件成功、失敗0件。

追加スチルを実際の結末で表示する確認と、専用精霊を戦闘に出す確認は、まだ割り当てていないため未実施。今回の画面確認はデスクトップのアプリ内ブラウザで行った。
