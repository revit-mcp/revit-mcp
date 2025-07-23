import { RevitClientConnection } from "./SocketClient.js";

/**
 * Revitクライアントに接続して操作を実行する
 * @param operation 接続成功後に実行する操作関数
 * @returns 操作の結果
 */
export async function withRevitConnection<T>(
  operation: (client: RevitClientConnection) => Promise<T>
): Promise<T> {
  const revitClient = new RevitClientConnection("localhost", 8080);

  try {
    // 连接到Revit客户端
    if (!revitClient.isConnected) {
      await new Promise<void>((resolve, reject) => {
        const onConnect = () => {
          revitClient.socket.removeListener("connect", onConnect);
          revitClient.socket.removeListener("error", onError);
          resolve();
        };

        const onError = (error: any) => {
          revitClient.socket.removeListener("connect", onConnect);
          revitClient.socket.removeListener("error", onError);
          reject(new Error("connect to revit client failed"));
        };

        revitClient.socket.on("connect", onConnect);
        revitClient.socket.on("error", onError);

        revitClient.connect();

        setTimeout(() => {
          revitClient.socket.removeListener("connect", onConnect);
          revitClient.socket.removeListener("error", onError);
          reject(new Error("Revitクライアントへの接続に失敗しました"));
        }, 5000);
      });
    }

    // 执行操作
    return await operation(revitClient);
  } finally {
    // 断开连接
    revitClient.disconnect();
  }
}
