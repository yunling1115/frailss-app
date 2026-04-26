import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";

export default function App() {
  const [message, setMessage] = useState("正在连接服务器...");

  useEffect(() => {
    fetch("http://172.20.10.2:3000/api/test")  // 你的树莓派IP + 端口
      .then((res) => res.json())
      .then((data) => setMessage(`成功: ${data.message}`))
      .catch((err) => setMessage(`失败: ${err.message}`));
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 18 }}>{message}</Text>
    </View>
  );
}
