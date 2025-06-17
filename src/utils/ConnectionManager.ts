import { ApplicationClientConnection } from "./SocketClient.js";

/**
 * 连接到应用程序客户端并执行操作
 * @param operation 连接成功后要执行的操作函数
 * @returns 操作的结果
 */
export async function withApplicationConnection<T>(
  operation: (client: ApplicationClientConnection) => Promise<T>
): Promise<T> {
  const appClient = new ApplicationClientConnection("localhost", 8080); // Default port, may need to be configured for Civil 3D plugin

  try {
    // 连接到应用程序客户端
    if (!appClient.isConnected) {
      await new Promise<void>((resolve, reject) => {
        const onConnect = () => {
          appClient.socket.removeListener("connect", onConnect);
          appClient.socket.removeListener("error", onError);
          resolve();
        };

        const onError = (error: any) => {
          appClient.socket.removeListener("connect", onConnect);
          appClient.socket.removeListener("error", onError);
          reject(new Error("connect to application client failed"));
        };

        appClient.socket.on("connect", onConnect);
        appClient.socket.on("error", onError);

        appClient.connect();

        setTimeout(() => {
          appClient.socket.removeListener("connect", onConnect);
          appClient.socket.removeListener("error", onError);
          reject(new Error("连接到应用程序客户端失败"));
        }, 5000);
      });
    }

    // 执行操作
    return await operation(appClient);
  } finally {
    // 断开连接
    appClient.disconnect();
  }
}
