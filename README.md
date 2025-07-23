
[![MseeP.ai セキュリティ評価バッジ](https://mseep.net/pr/revit-mcp-revit-mcp-badge.png)](https://mseep.ai/app/revit-mcp-revit-mcp)

# revit-mcp

日本語 | [简体中文](README_zh.md)

## 説明

revit-mcpは、MCPプロトコルに対応したクライアント（Claude、Clineなど）を通じてRevitと連携できるツールです。

本プロジェクトはサーバー側（AIにツールを提供）であり、[revit-mcp-plugin](https://github.com/revit-mcp/revit-mcp-plugin)（Revitを操作するプラグイン）と併用する必要があります。

[Discordに参加](https://discord.gg/cGzUGurq) | [QQグループ](http://qm.qq.com/cgi-bin/qm/qr?_wv=1027&k=kLnQiFVtYBytHm7R58KFoocd3mzU_9DR&authKey=fyXDOBmXP7FMkXAWjddWZumblxKJH7ZycYyLp40At3t9%2FOfSZyVO7zyYgIROgSHF&noverify=0&group_code=792379482)

## 特徴

- AIがRevitプロジェクトのデータを取得可能
- AIがRevitの要素の作成・編集・削除を操作可能
- AIが生成したコードをRevitに送信して実行可能（必ず成功するとは限りません。要件が明確な単純なシナリオでは成功率が高いです）

## 必要条件

- nodejs 18以上

> 完全なインストール環境についてはrevit-mcp-pluginの要件も考慮する必要があります。詳細は[revit-mcp-plugin](https://github.com/revit-mcp/revit-mcp-plugin)をご参照ください。

## インストール

### 1. ローカルMCPサービスのビルド

依存関係のインストール

```bash
npm install
```

ビルド

```bash
npm run build
```

### 2. クライアント設定

**Claudeクライアント**

Claudeクライアント → 設定 > 開発者 > 設定を編集 > claude_desktop_config.json

```json
{
	"mcpServers": {
		"revit-mcp": {
			"command": "node",
			"args": ["<ビルド済みファイルへのパス>\\build\\index.js"]
		}
	}
}
```

Claudeクライアントを再起動してください。ハンマーアイコンが表示されれば、MCPサービスとの接続が正常です。

![claude](./assets/claude.png)

## フレームワーク

```mermaid
flowchart LR
	CladueDesktop --> revit-mcp --> SocketService--commandName-->CommandlSet--command-->CommandExecute
	CommandManager --> CommandlSet
	CommandExecute --executeResult--> SocketService
	CommandProject1 --> CommandManager
	CommandProject2 --> CommandManager
	CommandProject... --> CommandManager
	subgraph ide1 [MCPClient]
	CladueDesktop
	end
	subgraph ide2 [MCPServer]
	revit-mcp
	end
	subgraph ide3 [Revit]
			subgraph ide3.1 [revit-mcp-plugin]
				SocketService
				CommandlSet
				CommandManager
				CommandExecute
			end
	end
```

## サポートされているツール

| 名前                        | 説明                                         |
| --------------------------- | -------------------------------------------- |
| get_current_view_info       | 現在のビュー情報を取得                       |
| get_current_view_elements   | 現在のビューの要素を取得                     |
| get_available_family_types  | 現在のプロジェクトで利用可能なファミリータイプを取得 |
| get_selected_elements       | 選択中の要素を取得                           |
| create_point_based_element  | 点基準の要素を作成（ドア、窓、家具など）      |
| create_line_based_element   | 線基準の要素を作成（壁、梁、パイプなど）      |
| create_surface_based_element| 面基準の要素を作成（床、天井など）           |
| delete_elements             | 要素を削除                                   |
| reset_model                 | モデルをリセット（連続対話時にプロセスモデルを削除）|
| modify_element              | 要素のプロパティ（インスタンスパラメータ）を編集 |
| search_modules              | 利用可能なモジュールを検索                   |
| use_module                  | モジュールを利用                             |
| send_code_to_revit          | Revitにコードを送信して実行                  |
| color_splash                | パラメータ値に基づき要素に色付け             |
| tag_walls                   | ビュー内の全ての壁にタグ付け                 |
