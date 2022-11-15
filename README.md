本项目为[Adachi-BOT](https://github.com/SilveryStar/Adachi-BOT)衍生插件，用于原神抽卡记录分析！

# 1.使用方法

项目下载后，直接将genshin_draw_analysis文件夹复制到，[原项目](https://github.com/SilveryStar/Adachi-BOT)plugins文件夹下即可。

# 2.命令触发

以下示例为默认指令头。

- `#su`: 设置抽卡分析链接或者米游社通行证 `Cookie` (`Cookie` 的作用是自动生成抽卡链接，如果没有通过此指令设置 `Cookie` 将会使用你私人服务中的 `Cookie`，具体使用可使用 `#detial`
  指令查看。 )
    - 链接获取方式参考[此教程](https://mp.weixin.qq.com/s/WcH6DgBRoAwbnmOlGTJBNg)
    - `Cookie` 是米游社的通行证页面的 `Cookie`，建议浏览器无痕模式访问 [米哈游通行证](https://user.mihoyo.com/)，登录个人通行证账号后 `F12` 在 `Console`
      或者控制台栏里输入 `document.cookie` 回车获取。或者在新建书签，在书签的网址处填写下面的代码。

```js
javascript:(function () {
    let domain = document.domain;
    let cookie = document.cookie;
    const text = document.createElement('textarea');
    text.hidden = true;
    text.value = cookie;
    document.body.appendChild(text);
    text.select();
    text.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(text.value).then(() => {
        alert('domain:' + domain + '\ncookie is in clipboard');
    });
    document.body.removeChild(text);
})();
```

- `#da`: 分析抽卡记录，可选参数为 `私人服务序号` 和 `样式`，比如：`#da 1 2` 即使用私人服务1号的 `Cookie` 和 第2种样式（PC样式）生成分析图，具体使用可使用 `#detial` 指令查看。
- `#dah`: 历史抽卡分析，即使用之前的数据生成分析图。可选参数为 `样式`，同 `#da` 的此参数。
- `#export`: 导出抽卡分析数据，可选参数 `json` 或 `excel`或 `url`，在群聊使用该指令会将结果上传至群文件，在私聊如果 BOT 持有者未配置 OSS 则不能使用。
- `#import`: 导入抽卡分析数据，可选参数 `json` 或 `excel`，在群聊使用可通过先将文件发到群里再回复那条消息，回复消息的同时使用该指令；在私聊不能使用回复的方式(也许也能行)
  ，可使用 `#import json https://example.com/abc.json` 这种给一个文件的下载链接导入，此方法群聊、私聊都可用。
- `#del`: 删除默认账号的抽卡历史记录，即上次分析抽卡时的 `uid` 的记录，为了避免误删其他用户数据，因此如果要删除其他 `uid` 的数据请重新使用 `#da` 指令重置当前用户的 `uid` 。

# 3.常见问题

## 3.1返回图片出现字体乱码

出现问题原因为linux中文字体缺失， 可参考 [此文章](https://www.cnblogs.com/helios-fz/p/13706157.html)安装字体后 重启bot

docker部署可参考[此issue](https://github.com/wickedll/genshin_draw_analysis/issues/5) 安装字体

## 3.2提示visit too frequently

此为mhy接口限制 某一时间内请求次数超过最大限制，此时只需将draw_analysis.ts里面的sleep延时数值调高一点即可（49行 调500-700
不行就再调大一点） [issue](https://github.com/wickedll/genshin_draw_analysis/issues/4)

## 3.3提示authkey timeout或authkey error

authkey过期或有误，重新获取url设置。

## 3.4 提示安装 exceljs 等报错

此问题大概率出现在 Windows 系统，可尝试在程序启动前手动安装 `exceljs`、`qiniu` 、 `qrcode`、`@aws-sdk/client-s3` 四个依赖，`exceljs`
为必选依赖，其他依赖若未在配置中启用也可不安装。

# 4.更新日志

- 增加AWS S3上传支持（配置需要自行添加，也可以备份后删除文件重新生成）。 2022/11/14
- 增加导出抽卡分析链接的功能，此链接可在其他同类软件/网站使用。 2022/11/13
- 增加清除账号的抽卡历史记录指令；修复导入的数据保存到错误`key`导致的数据丢失问题；修复排序函数未正确排序的问题；增加简繁字体转化处理因为繁体字导致的资源图获取不到的问题；支持私聊导出链接转二维码发送；更换字体为文泉译微软雅黑。
  2022/09/29
- 支持 [UIGF 标准](https://github.com/DGP-Studio/Snap.Genshin/wiki/StandardFormat#export_app)
  的导入导出；导出时在群聊中使用将上传至群文件，私聊如开启 `OSS` 则上传至 `OSS` ，否则私聊不可用。 2022/09/26
- 在设置抽卡分析链接的指令中增加单独设置抽卡分析`Cookie`的功能，可以与私人服务的`Cookie`独立互不影响，分析时兼容私人服务的`Cookie`优先用单独设置的`Cookie`，没有则使用私人服务中的`Cookie`。
  2022/09/22
- 修复分析指令单个参数未生效的问题; 解决`login_ticket`频繁过期需要经常换`Cookie`的问题。2022/09/22
- 抽卡分析指令增加指定私人服务序号的功能（之前与样式公用值，算是个小 bug ）。2022/09/22
- 修复缓存中的过期链接导致无法自动生成新的 AuthKey 的问题 2022/09/21
- 增加根据 `Cookie` 生成抽卡链接功能，此 `Cookie` 必须包含 `login_ticket`，`login_uid` 字段（可从 [米哈游通行证](https://user.mihoyo.com/)
  ）获取。2022/09/21
- linux不再需要另外安装字体已内嵌引入字体；浏览器调整为使用公共浏览器 2022/05/19
- 新增返回卡片样式选择 2022/04/24
- 调整抽卡记录保存方式 支持合并历史记录分析（此版本之前数据不做处理） 2022/03/19
- 增加颜色 修复抽卡记录过多出现死循环问题 2022/03/19
- URL支持web页与api 2022/03/04
- 修复5星平均出货次数计算错误问题 2022/03/04

# 5. 配置文件

```yaml
tips: |
    accessKey和secretKey是七牛云的两个密钥AK、SK
    bucket是你创建的空间名
    domain是你文件访问的域名（带协议头，如：https://sources.demo.com/）
    folder是文件上传后的目录，比如:bot/gacha_export
    uses3是否使用AWS S3功能（与七牛云正常上传二选一，S3可以实现将文件存储在其他OSS）
    s3endpoint是你OSS的地区域名
    s3region是OSS所在区域，一般是s3endpoint的第三级域名（七牛云的不同需要将第三级域名中的s3-去掉）
qiniuOss:
    enable: false
    accessKey: ""
    secretKey: ""
    bucket: ""
    domain: ""
    folder: ""
    uses3: false
    s3endpoint: ""
    s3region: ""
qrcode: false
aliases:
    - 抽卡分析
```

# 6.LICENSE

[LICENSE](https://github.com/wickedll/genshin_draw_analysis/blob/master/LICENSE)