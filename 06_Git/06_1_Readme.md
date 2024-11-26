<!-- omit in toc -->
# Gitナレッジ
Gitのナレッジ＋GitHubメインで記載していくと思う

## Gitの概要

### いにしえのバージョン管理方法
正確にはバージョンが「ちゃんと管理できていない」手法

ローカルで適当なフォルダを用意
設計書を適当に作成していく
末尾に日付つけたり、バージョンつけたり、最新とか、oldとかつけてみたり

・問題点
どれが最新化分からない＝途中から取り込まれない内容があっても把握できない可能性
リリースVer1の時の設計書となると、まるっとコピーして退避が必要

### SVN（サブバージョン）の管理方法
管理：集中型バージョン管理
管理単位：差分

Teamsのシェアポを例に説明してみる？

・簡単な流れ
ファイルごとにロック→修正→コミット

・問題点
原則、1ファイル1人しか修正出来ない
特定の断面に戻すのに苦労する、差分を頑張って反映しなきゃなー


### Gitの管理方法
管理：分散型
管理単位：スナップショット（色々なファイル丸ごと）

ローカル→ステージ→リポジトリ