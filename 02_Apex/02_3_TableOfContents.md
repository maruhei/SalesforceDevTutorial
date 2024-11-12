<!-- omit in toc -->
# Apexの学習目次
どこまで紹介できるか不明ですが、こんな順番で勉強した方が良いかも？をメモ
全部のサンプルソースを

1. **Apexの紹介**
   - 概要と基本構文　⇒Java知ってるなら要らないと思う
   - JavaとApexの違い　⇒既に紹介した

2. **トリガー**
   - 基本と使用方法
   - BeforeトリガーとAfterトリガー
   - トリガーでのDML操作とSOQLクエリ

3. **SOQLとSOSL**
   - SOQL（Salesforce Object Query Language）の紹介
   - SOSL（Salesforce Object Search Language）の紹介

4. **DML操作**
   - 挿入、更新、削除
   - トランザクション制御

5. **非同期処理**
   - Futureメソッド
   - キューApex

6. **バッチApex**
   - Database.Batchableインターフェースの実装
   - Start、Execute、Finishメソッド
   - バッチジョブの実行とモニタリング

7. **スケジュールApex**
   - Schedulableインターフェースの実装
   - System.scheduleによるスケジュール設定

8. **REST/SOAP API**
   - REST APIの基本
   - SOAP APIの基本⇒最近、SOAP見かける機会が無いから優先度低
   - カスタムWebサービスの作成

9. **カスタムWebサービス⇒8と被ってそうだからやらない**
   - カスタムREST APIの作成
   - カスタムSOAP APIの作成

10. **ユニットテスト**
    - テストクラスの作成⇒簡単な例は紹介済
    - ユニットテストのベストプラクティス⇒これの優先度上げた方が良い気がする
    - コードカバレッジ要件の理解⇒紹介済

11. **追加トピック**
    - VisualforceとLightningコンポーネント⇒別フォルダ(03_LWC,04_VisualForceで記載予定)
    - Salesforceにおけるセキュリティと認証

12. **結論**
    - 重要な概念のまとめ
    - さらなる学習の次のステップ