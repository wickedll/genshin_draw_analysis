const template =
	`<div class="statistic-item">
    <img class="background" :src="background" alt="ERROR"/>
    <img class="main2" :src="mainImage" alt="ERROR"/>
    <div class="corner"/>
    <div class="count">{{ data.count }}</div>
</div>`;

const { defineComponent, computed } = Vue;

export default defineComponent( {
	name: "Character",
	template,
	props: {
		data: Object
	},
	setup( props ) {
		const background = computed( () => {
			return `/genshin_draw_analysis/assets/images/5-Star.png`;
		} );
		const mainImage = computed( () => {
			const type = props.data.type === "角色" ? "character" : "weapon";
			const icon = props.data.type === "角色" ? "face" : "thumb";
			const lang = props.data.lang;
			let name = props.data.name;
			if ( lang !== 'zh-cn' ) {
				name = simplified( props.data.name );
			}
			return `/genshin/adachi-assets/${ type }/${ encodeURI( name ) }/image/${ icon }.webp`;
		} );
		
		return {
			background,
			mainImage
		}
	}
} );