/* Token Tracker V2 · One-time setup
 * Run this script once in Scriptable before adding the widgets.
 */
const alert=new Alert();
alert.title="Token Tracker V2 设置";
alert.message="配置你的自托管 V2 API。设置仅保存在 Scriptable 本机文档目录。";
alert.addTextField("API URL","https://example.com/token-tracker/v2");
alert.addSecureTextField("API Key","");
alert.addAction("保存");
alert.addCancelAction("取消");
const choice=await alert.present();
if(choice===-1){Script.complete();}else{
const apiUrl=alert.textFieldValue(0).trim().replace(/\/+$/,"");
const apiKey=alert.textFieldValue(1).trim();
if(!/^https?:\/\//.test(apiUrl)||!apiKey)throw new Error("请输入有效的 HTTP(S) API URL 和 API Key。其它组件不会内置任何凭据。");
const fm=FileManager.local();
const path=fm.joinPath(fm.documentsDirectory(),"token-tracker-v2-settings.json");
fm.writeString(path,JSON.stringify({apiUrl,apiKey},null,2));
const done=new Alert();
done.title="设置已保存";
done.message="现在可以运行任意 Token Tracker V2 小组件。重新运行本脚本可更新配置。";
done.addAction("完成");
await done.present();
Script.complete();
}
