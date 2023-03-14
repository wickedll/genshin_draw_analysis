const template =
	`<div class="main2">
	<span class="header">UID{{uid}}的抽卡记录分析</span>
	<div class="main">
		<div class="item" v-show="info['301'].total > 0">
			<span class="title">角色活动祈愿</span>
			<div id="up-role" style="width:400px;height:400px;"></div>
			<span class="time">{{info['301'].time}}</span>
			<div class="info">
				<p><span class="total">总计 <span class="lj">{{ info['301'].total }}</span> 抽 已累计 <span class="wc">{{info['301'].wc}}</span> 抽未出5星</span></p>
				<p>
					<span class="five"><span class="statistics">5星：{{info['301'].w5+info['301'].j5}}</span>[{{info['301'].lv5}}]</span>
					<span class="four"><span class="statistics">4星：{{info['301'].w4+info['301'].j4}}</span>[{{info['301'].lv4}}]</span>
					<span class="third"><span class="statistics">3星：{{info['301'].w3}}</span>[{{info['301'].lv3}}]</span>
				</p>
				<p><div class="jl">
					<span>5星历史记录：</span>
					<span v-for="el in info['301'].history" class="jl2">
						<span :style="{'color': getColor(el.name)}">{{el.name}}[{{el.count}}]&nbsp;</span>
					</span>
				</div></p>
				<p><span class="total">5星平均出货次数为：<span class="per">{{info['301'].per}}</span></span></p>
			</div>
		</div>
		<div class="item" v-show="info['302'].total > 0">
			<span class="title">武器活动祈愿</span>
			<div id="up-arms" style="width:400px;height:400px;"></div>
			<span class="time">{{info['302'].time}}</span>
			<div class="info">
				<p><span class="total">总计 <span class="lj">{{ info['302'].total }}</span> 抽 已累计 <span class="wc">{{info['302'].wc}}</span> 抽未出5星</span></p>
				<p>
					<span class="five"><span class="statistics">5星：{{info['302'].w5+info['302'].j5}}</span>[{{info['302'].lv5}}]</span>
					<span class="four"><span class="statistics">4星：{{info['302'].w4+info['302'].j4}}</span>[{{info['302'].lv4}}]</span>
					<span class="third"><span class="statistics">3星：{{info['302'].w3}}</span>[{{info['302'].lv3}}]</span>
				</p>
				<p><div class="jl">
					<span>5星历史记录：</span>
					<span v-for="el in info['302'].history" class="jl2">
						<span :style="{'color': getColor(el.name)}">{{el.name}}[{{el.count}}]&nbsp;</span>
					</span>
				</div></p>
				<p><span class="total">5星平均出货次数为：<span class="per">{{info['302'].per}}</span></span></p>
			</div>
		</div>
		<div class="item" v-show="info['200'].total > 0">
			<span class="title">常驻祈愿</span>
			<div id="permanent" style="width:400px;height:400px;"></div>
			<span class="time">{{info['200'].time}}</span>
			<div class="info">
				<p><span class="total">总计 <span class="lj">{{ info['200'].total }}</span> 抽 已累计 <span class="wc">{{info['200'].wc}}</span> 抽未出5星</span></p>
				<p>
					<span class="five"><span class="statistics">5星：{{info['200'].w5+info['200'].j5}}</span>[{{info['200'].lv5}}]</span>
					<span class="four"><span class="statistics">4星：{{info['200'].w4+info['200'].j4}}</span>[{{info['200'].lv4}}]</span>
					<span class="third"><span class="statistics">3星：{{info['200'].w3}}</span>[{{info['200'].lv3}}]</span>
				</p>
				<p><div class="jl">
					<span>5星历史记录：</span>
					<span v-for="el in info['200'].history" class="jl2">
						<span :style="{'color': getColor(el.name)}">{{el.name}}[{{el.count}}]&nbsp;</span>
					</span>
				</div></p>
				<p><span class="total">5星平均出货次数为：<span class="per">{{info['200'].per}}</span></span></p>
			</div>
		</div>
		
		<div class="item" v-show="info['100'].total > 0">
			<span class="title">新手祈愿</span>
			<div id="novice" style="width:400px;height:400px;"></div>
			<span class="time">{{info['100'].time}}</span>
			<div class="info">
				<p><span class="total">总计 <span class="lj">{{ info['100'].total }}</span> 抽 已累计 <span class="wc">{{info['100'].wc}}</span> 抽未出5星</span></p>
				<p>
					<span class="five"><span class="statistics">5星：{{info['100'].w5+info['100'].j5}}</span>[{{info['100'].lv5}}]</span>
					<span class="four"><span class="statistics">4星：{{info['100'].w4+info['100'].j4}}</span>[{{info['100'].lv4}}]</span>
					<span class="third"><span class="statistics">3星：{{info['100'].w3}}</span>[{{info['100'].lv3}}]</span>
				</p>
				<p><div class="jl">
					<span>5星历史记录：</span>
					<span v-for="el in info['100'].history" class="jl2">
						<span :style="{'color': getColor(el.name)}">{{el.name}}[{{el.count}}]&nbsp;</span>
					</span>
				</div></p>
				<p><span class="total">5星平均出货次数为：<span class="per">{{info['100'].per}}</span></span></p>
			</div>
		</div>
		
		<div class="tips" v-show="info['301'].total === 0 && info['302'].total === 0 && info['200'].total === 0 && info['100'].total === 0">您无抽卡记录，或者抽卡记录已全部过期。</div>
	</div>
	<div class="footer">Create by lishengqunchn © lishengqun.com</div>
</div>`;

const { defineComponent } = Vue;

export default defineComponent( {
	name: "AnalysisApp",
	template,
	components: {},
	mounted() {
		let that = this;
		let data = that.info;
		let keys = Object.keys( this.info );
		for ( let index = 0; index < keys.length; index++ ) {
			const element = keys[index];
			let key = parseInt( element );
			switch ( key ) {
				case 100:
					if ( data[element].total === 0 ) {
						break;
					}
					// 初始化图表标签
					const myChart100 = echarts.init( document.getElementById( 'novice' ) );
					const options100 = {
						legend: {
							left: 'center',
							top: '10%',
							selected: {
								'三星武器': data[element].w3 <= 20
							}
						},
						textStyle: {
							fontFamily: 'GachaFont',
							fontStyle: 'normal',
						},
						series: [ {
							type: 'pie',
							stillShowZeroSum: false,
							top: 50,
							radius: '50%',
							startAngle: 70,
							color: [ '#fac858', '#ee6666', '#5470c6', '#91cc75', '#73c0de' ],
							data: [
								{
									value: data[element].j5,
									name: '五星角色'
								},
								{
									value: data[element].w5,
									name: '五星武器'
								},
								{
									value: data[element].j4,
									name: '四星角色'
								},
								{
									value: data[element].w4,
									name: '四星武器'
								},
								{
									value: data[element].w3,
									name: '三星武器'
								}
							]
						} ]
					};
					myChart100.setOption( options100 );
					break;
				case 301:
					if ( data[element].total === 0 ) {
						break;
					}
					// 初始化图表标签
					const myChart301 = echarts.init( document.getElementById( 'up-role' ), null, { renderer: 'svg' } );
					const options301 = {
						legend: {
							left: 'center',
							top: '10%',
							selected: {
								'三星武器': data[element].w3 <= 20
							}
						},
						textStyle: {
							fontFamily: 'GachaFont',
							fontStyle: 'normal',
						},
						series: [ {
							type: 'pie',
							stillShowZeroSum: false,
							top: 50,
							radius: '50%',
							startAngle: 70,
							color: [ '#fac858', '#5470c6', '#91cc75', '#73c0de' ],
							data: [
								{
									value: data[element].j5,
									name: '五星角色'
								},
								{
									value: data[element].j4,
									name: '四星角色'
								},
								{
									value: data[element].w4,
									name: '四星武器'
								},
								{
									value: data[element].w3,
									name: '三星武器'
								}
							]
						} ]
					};
					myChart301.setOption( options301 );
					break;
				case 302:
					if ( data[element].total === 0 ) {
						break;
					}
					// 初始化图表标签
					const myChart302 = echarts.init( document.getElementById( 'up-arms' ) );
					const options302 = {
						legend: {
							left: 'center',
							top: '10%',
							selected: {
								'三星武器': data[element].w3 <= 20
							}
						},
						textStyle: {
							fontFamily: 'GachaFont',
							fontStyle: 'normal',
						},
						series: [ {
							type: 'pie',
							stillShowZeroSum: false,
							top: 50,
							radius: '50%',
							startAngle: 70,
							color: [ '#ee6666', '#5470c6', '#91cc75', '#73c0de' ],
							data: [
								{
									value: data[element].w5,
									name: '五星武器'
								},
								{
									value: data[element].j4,
									name: '四星角色'
								},
								{
									value: data[element].w4,
									name: '四星武器'
								},
								{
									value: data[element].w3,
									name: '三星武器'
								}
							]
						} ]
					};
					myChart302.setOption( options302 );
					break;
				case 200:
					if ( data[element].total === 0 ) {
						break;
					}
					// 初始化图表标签
					const myChart200 = echarts.init( document.getElementById( 'permanent' ) );
					const options200 = {
						legend: {
							left: 'center',
							top: '10%',
							selected: {
								'三星武器': data[element].w3 <= 20
							}
						},
						textStyle: {
							fontFamily: 'GachaFont',
							fontStyle: 'normal',
						},
						series: [ {
							type: 'pie',
							stillShowZeroSum: false,
							top: 50,
							radius: '50%',
							startAngle: 70,
							color: [ '#fac858', '#ee6666', '#5470c6', '#91cc75', '#73c0de' ],
							data: [
								{
									value: data[element].j5,
									name: '五星角色'
								},
								{
									value: data[element].w5,
									name: '五星武器'
								},
								{
									value: data[element].j4,
									name: '四星角色'
								},
								{
									value: data[element].w4,
									name: '四星武器'
								},
								{
									value: data[element].w3,
									name: '三星武器'
								}
							]
						} ]
					};
					myChart200.setOption( options200 );
					break;
				default:
					break;
			}
		}
	},
	setup() {
		const urlParams = parseURL( location.search );
		const data = request( `/api/analysis/result?qq=${ urlParams.qq }` );
		let data2 = {};
		const result = JSON.parse( data.data );
		let uid = "";
		for ( let index = 0; index < result.length; index++ ) {
			const element = result[index];
			let total = element.data.length;
			let total5 = 0;
			element.data.sort( sortData );
			let w5 = 0;
			let j5 = 0;
			let w4 = 0;
			let j4 = 0;
			let w3 = 0;
			let count = 1;//出五星计数
			let arr5 = [];
			let index5 = 0;
			for ( let index = 0; index < total; index++ ) {
				const item = element.data[index];
				uid = item.uid;
				if ( item.rank_type === "3" && item.item_type === '武器' ) {
					w3++;
				}
				if ( item.rank_type === "4" && item.item_type === '武器' ) {
					w4++;
				}
				if ( item.rank_type === "5" && item.item_type === '武器' ) {
					w5++;
					arr5.push( { count, name: item.name } );
					total5 += count;
					count = 0;
					index5 = index;
				}
				
				if ( item.rank_type === "5" && item.item_type === '角色' ) {
					j5++;
					total5 += count;
					arr5.push( { count, name: item.name } );
					count = 0;
					index5 = index;
				}
				
				if ( item.rank_type === "4" && item.item_type === '角色' ) {
					j4++;
				}
				count++;
			}
			data2[element.key] = {
				w5,
				j5,
				j4,
				w4,
				w3,
				history: arr5,
				per: total5 === 0 ? 0 : ( total5 / ( w5 + j5 ) ).toFixed( 2 ),
				total,
				wc: total > 0 ? ( total - index5 - 1 ) : 0,
				lv5: total === 0 ? ( 0 + '%' ) : ( ( ( w5 + j5 ) / total * 100 ).toFixed( 2 ) + '%' ),
				lv4: total === 0 ? ( 0 + '%' ) : ( ( ( w4 + j4 ) / total * 100 ).toFixed( 2 ) + '%' ),
				lv3: total === 0 ? ( 0 + '%' ) : ( ( ( w3 ) / total * 100 ).toFixed( 2 ) + '%' ),
				time: total > 0 ? `${ element.data[0].time.split( " " )[0] }  ~  ${ element.data[total - 1].time.split( " " )[0] }` : ""
			}
		}
		const getColor = function ( name ) {
			let index = getRandomNum( 0, colors.length - 1 );
			if ( nameColor[name] ) {
				return nameColor[name];
			}
			// //颜色用尽 返回默认颜色
			if ( Object.keys( usedColor ).length >= colors.length ) {
				usedColor = {};
				return getColor( name );
			}
			let color = colors[index];
			while ( usedColor[color] ) {
				index = getRandomNum( 0, colors.length - 1 );
				color = colors[index];
			}
			usedColor[color] = 1;
			nameColor[name] = color;
			return color;
		}
		return {
			info: data2,
			uid,
			getColor
		}
	}
} );

//颜色池
const colors = [
	'#5470c6', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc', '#2ab7ca',
	'#005b96', '#ff8b94', '#72a007', '#b60d1b', '#16570d'
]
let usedColor = {}
let nameColor = {}