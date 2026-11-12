# 音源のクレジット

## assets/music/ の11曲

このゲーム用に作曲した旋律を、**FluidR3_GM**（Frank Wen 作、MIT ライセンス）の SoundFont で演奏し、FluidSynth（LGPL）で録音しました。ゲームに同梱しているのは録音だけで、SoundFont 本体は含みません。作曲とレンダリングの手順は `tools/compose_music.py` にあります。

- FluidR3_GM：Debian / Ubuntu の `fluid-soundfont-gm` パッケージ。ライセンスは同パッケージの copyright に記載（MIT）
- FluidSynth：https://www.fluidsynth.org/

## 氷湖の小旅行の2曲（以前の版から継続）

「湖面に届く手紙」（lake-letters.ogg）と「同じ灯りのそばで」（beside-the-same-light.ogg）は、GeneralUser GS v2.0.3 by S. Christian Collins の SoundFont でレンダリングした録音です。どちらも80秒、6/8拍子の32小節で、和声と小節の位置をそろえてあり、切り替える時に再生位置を合わせてクロスフェードします。

- 音源配布元：https://www.schristiancollins.com/generaluser.php
- 利用条件：https://github.com/mrbumpy409/GeneralUser-GS/blob/main/documentation/LICENSE.txt
- レンダラー：TinySoundFont-pybind / TinySoundFont（MIT） https://github.com/nwhitehead/tinysoundfont-pybind

いずれも演奏はサンプル音源によるもので、生演奏の録音ではありません。
