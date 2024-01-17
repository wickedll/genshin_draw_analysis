import { QiniuOssConfig } from "#/genshin_draw_analysis/util/types";

export default class GachaAnalysisConfig {
	public static readonly FILE_NAME: string = "gacha_analysis";
	public static init = {
		tips: "accessKey和secretKey是七牛云的两个密钥AK、SK\n" +
			"bucket是你创建的空间名\n" +
			"domain是你文件访问的域名（带协议头，如：https://sources.demo.com/）\n" +
			"folder是文件上传后的目录，比如:bot/gacha_export\n" +
			"uses3是否使用AWS S3功能（与七牛云正常上传二选一，S3可以实现将文件存储在其他OSS）\n" +
			"s3endpoint是你OSS的地区域名\n" +
			"s3region是OSS所在区域，一般是s3endpoint的第三级域名（七牛云的不同需要将第三级域名中的s3-去掉）\n",
		qiniuOss: {
			enable: false,
			accessKey: '',
			secretKey: '',
			bucket: '',
			domain: '',
			folder: "",
			uses3: false,
			s3endpoint: "",
			s3region: ""
		},
		qrcode: false,
		aliases: [ "抽卡分析" ]
	};
	public qiniuOss: QiniuOssConfig;
	
	/**
	 * 是否将链接转为二维码发送
	 */
	public qrcode: boolean;
	public aliases: string[];
	
	constructor( config: any ) {
		this.qiniuOss = {
			enable: config.qiniuOss.enable,
			accessKey: config.qiniuOss.accessKey,
			secretKey: config.qiniuOss.secretKey,
			bucket: config.qiniuOss.bucket,
			domain: config.qiniuOss.domain,
			folder: config.qiniuOss.folder,
			uses3: config.qiniuOss.uses3,
			s3endpoint: config.qiniuOss.s3endpoint,
			s3region: config.qiniuOss.s3region
		}
		this.qrcode = config.qrcode;
		this.aliases = config.aliases;
	}
}