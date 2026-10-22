// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-brown; icon-glyph: key;
/* Token Tracker V4 · Atelier · one-time setup
 * Credentials are stored only in Scriptable's local documents directory, never in widget source.
 */
const alert = new Alert();
alert.title = "Token Tracker V4 设置";
alert.message = "填写你的自托管 API（/v3 路由）。设置只保存在 Scriptable 本机文档目录。";
alert.addTextField("API URL", "https://example.com/token-tracker/v3");
alert.addSecureTextField("API Key", "");
alert.addAction("保存");
alert.addCancelAction("取消");
const choice = await alert.present();
if (choice === -1) Script.complete();
else {
  const apiUrl = alert.textFieldValue(0).trim().replace(/\/+$/, ""), apiKey = alert.textFieldValue(1).trim();
  if (!/^https?:\/\//.test(apiUrl) || !apiKey) throw new Error("请输入有效的 HTTP(S) API URL 和 API Key。");
  const fm = FileManager.local(), path = fm.joinPath(fm.documentsDirectory(), "token-tracker-v4-settings.json");
  fm.writeString(path, JSON.stringify({ apiUrl, apiKey }, null, 2));
  const done = new Alert(); done.title = "V4 设置已保存"; done.message = "现在可以添加七个 V4 小组件。V4 也会读取已有的 V3 / V2 设置。"; done.addAction("完成");
  await done.present(); Script.complete();
}
