本项目为[Adachi-BOT](https://github.com/SilveryStar/Adachi-BOT)衍生插件，用于原神抽卡记录分析！

# 1.使用方法

项目下载后，直接将genshin_draw_analysis文件夹复制到，[原项目](https://github.com/SilveryStar/Adachi-BOT)plugins文件夹下即可。

# 2.命令触发

以下示例为默认指令头。

- 链接获取方式参考[此教程](https://mp.weixin.qq.com/s/WcH6DgBRoAwbnmOlGTJBNg)
- `Cookie` 是米游社的通行证页面的 `Cookie`，建议浏览器无痕模式访问 [米哈游通行证](https://user.mihoyo.com/)
  ，登录个人通行证账号后 `F12` 在 `Console` 或者控制台栏里输入 `document.cookie` 回车获取。或者在新建书签，在书签的网址处填写下面的代码。
- `Cookie` 也可以参考[胡桃工具箱](https://hut.ao/advanced/get-stoken-cookie-from-the-third-party.html)
  的这篇文章直接获取带有 `Stoken` 的 `Cookie`。
- `Cookie` 也可以使用 [mihoyo-login](https://github.com/BennettChina/mihoyo-login) 插件获取。

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

- `#da`: 分析抽卡记录，可选参数为 `私人服务序号` 和 `样式`以及`抽卡记录链接`，比如：`#da 1 2` 即使用私人服务1号的 `Cookie`
  和
  第2种样式（饼图样式）生成分析图，具体使用可使用 `#detial` 指令查看。比如：`#da https://hk4e-api.mihoyo.com/event/xxxxx` 。
- `#dah`: 历史抽卡分析，即使用之前的数据生成分析图。可选参数为 `样式`，同 `#da` 的此参数。
- `#export`: 导出抽卡分析数据，可选参数 `json` 或 `excel`或 `url`，在群聊使用该指令会将结果上传至群文件，在私聊如果 BOT
  持有者未配置 OSS 则不能使用。
- `#import`: 导入抽卡分析数据，可选参数 `json` 或 `excel`
  ，在群聊使用可通过先将文件发到群里再回复那条消息，回复消息的同时使用该指令；在私聊不能使用回复的方式(也许也能行)
  ，可使用 `#import json https://example.com/abc.json` 这种给一个文件的下载链接导入，此方法群聊、私聊都可用。
- `#del`: 删除默认账号的抽卡历史记录，即上次分析抽卡时的 `uid` 的记录，为了避免误删其他用户数据，因此如果要删除其他 `uid`
  的数据请重新使用 `#da` 指令重置当前用户的 `uid` 。

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

此问题大概率出现在 Windows 系统，可尝试在程序启动前手动安装 `exceljs`、`qiniu` 、 `qrcode`、`@aws-sdk/client-s3`
四个依赖，`exceljs`
为必选依赖，其他依赖若未在配置中启用也可不安装。

## 清理旧Cookie的方法

v2不再使用抽卡分析独立Cookie而使用私人服务的Cookie，要想清理这些冗余的数据，可以通过下面的命令删除。

```shell
## 第一步： 进入 redis 容器内部
docker exec -it adachi-redis bash

## 第二步：执行删除命令(端口、密码可参考注释内容修改)
#redis-cli -p <port> -a <password> keys <key_prefix>* | xargs redis-cli -p <port> -a <password> del

redis-cli -p 56379 keys "genshin_gacha.cookie.*" | xargs redis-cli -p 56379 del
```

# 4.更新日志

[CHANGELOG](./CHANGELOG.md)

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