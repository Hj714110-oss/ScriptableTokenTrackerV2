// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: orange; icon-glyph: cloud;
/* Token Tracker V3 · Pixel Edition · one-time setup
 * Credentials are stored only in Scriptable's local documents directory.
 */
const alert=new Alert();
alert.title="Token Tracker V3 设置";
alert.message="配置你的自托管 V3 API。设置仅保存在 Scriptable 本机文档目录，不写入组件源码。";
alert.addTextField("API URL","https://example.com/token-tracker/v3");
alert.addSecureTextField("API Key","");
alert.addAction("保存");
alert.addCancelAction("取消");
const choice=await alert.present();
if(choice===-1){Script.complete();}else{
 const apiUrl=alert.textFieldValue(0).trim().replace(/\/+$/,""),apiKey=alert.textFieldValue(1).trim();
 if(!/^https?:\/\//.test(apiUrl)||!apiKey)throw new Error("请输入有效的 HTTP(S) API URL 和 API Key。其它组件不会内置任何凭据。");
 const fm=FileManager.local(),path=fm.joinPath(fm.documentsDirectory(),"token-tracker-v3-settings.json");
 fm.writeString(path,JSON.stringify({apiUrl,apiKey},null,2));
 const done=new Alert();done.title="V3 设置已保存";done.message="现在可以添加七个 V3 小组件。重新运行本脚本可更新配置。";done.addAction("完成");await done.present();Script.complete();
}
