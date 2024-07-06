const utils = require('../../utils/utils')
const { getJson,getText } = require('../../utils/superagent')

const WARFRAME_HOST_V1 = "https://api.warframe.market/v1/"
const WARFRAME_HOST_V2 = "https://api.warframe.market/v2/"
const AUCTIONS_HOST = "https://warframe.market/auctions"
const AUCTIONS_HOST_ZH = "https://warframe.market/zh-hans/auctions"
const language_zh = 'zh-hans'
const language_en = 'en'

const index = {
    items:async (header = {language:language_zh}) => {
        const url = `${WARFRAME_HOST_V1}items`
        return (await getJson(url,header)).payload.items
    },
    rivenItems:async () => {
        const url = `${WARFRAME_HOST_V1}riven/items`
        return (await getJson(url)).payload.items
    },
    item:async (type, header = {language:language_zh}) => {
        const url = `${WARFRAME_HOST_V1}items/${type}`
        return (await getJson(url,header)).payload.item
    },
    auctions:async () => {
        let text_zh = await getText(AUCTIONS_HOST_ZH,{language:language_zh})
        let state_zh = JSON.parse(text_zh.match(/(?<=id="application-state">).*(?=<\/script>)/).join())
        let text_en = await getText(AUCTIONS_HOST,{language:language_en})
        let state_en = JSON.parse(text_en.match(/(?<=id="application-state">).*(?=<\/script>)/).join())
        let merge = (v1,v2)=>{ return {...v1,zh:v1.item_name,en:v2.item_name,code:v1.url_name}}
        let getKey = (v)=> v['url_name']
        //数据结构 :{ items,riven:{items,attributes},lich:{ephemeras,weapons,quirks},sister:{ephemeras,weapons,quirks}}
        let items_zh = await index.items()
        let items_en = await index.items({language:language_en})

        let items = utils.mergeArray(items_zh,items_en,getKey,merge)

        let riven_attributes = utils.mergeArray(state_zh.riven.attributes,state_en.riven.attributes,getKey,(v1,v2)=>{ return {...v1,zh:v1.effect,en:v2.effect,code:v1.url_name}})
        let riven_items = utils.mergeArray(state_zh.riven.items,state_en.riven.items,getKey,merge)

        let auctionsWeapons = utils.mergeArray(
            state_zh.lich.weapons.map(v => { return {...v,type:'lich'}}).concat(state_zh.sister.weapons.map(v => { return {...v,type:'sister'}})),
            state_en.lich.weapons.map(v => { return {...v,type:'lich'}}).concat(state_en.sister.weapons.map(v => { return {...v,type:'sister'}})),
            getKey,
            merge
        )
        let ephemeras = utils.mergeArray(
            state_zh.lich.ephemeras.concat(state_zh.sister.ephemeras),
            state_en.lich.ephemeras.concat(state_en.sister.ephemeras),
            getKey,
            merge
        )
        let quirks = utils.mergeArray(
            state_zh.lich.quirks.concat(state_zh.sister.quirks),
            state_en.lich.quirks.concat(state_en.sister.quirks),
            getKey,
            merge
        )
        return {
            items,
            riven_items,
            riven_attributes,
            auctionsWeapons,
            ephemeras,
            quirks
        }
    },
    auctionsSearch:async (type='riven', weapon_url_name)=>{
        // type : riven,lich,sister
        let url = `${WARFRAME_HOST_V1}auctions/search?type=${type}&weapon_url_name=${weapon_url_name}&polarity=any&buyout_policy=direct&sort_by=price_asc`
        return (await getJson(url)).payload.auctions.filter(v => v.owner.status !== 'offline')
    },
    orders:async (name = 'primed_chamber') =>{
        const url = `${WARFRAME_HOST_V1}items/${name}/orders`;
        let orderList = (await getJson(url)).payload
        let onlineList = orderList.orders
            .filter( (item) => item.order_type === 'sell'&&item.user.status !== 'offline')
            .sort((a,b) => a.platinum-b.platinum)
        let offlineList = orderList.orders
            .filter((item) => item.order_type === 'sell'&&item.user.status === 'offline')
            .sort((a,b)=> a.platinum-b.platinum)
        return onlineList.concat(offlineList)
    },
    statistics:async (name = 'primed_chamber')=> {
        const url = `${WARFRAME_HOST_V1}items/${name}/statistics`;
        return (await getJson(url)).payload.statistics_live['90days']
    }
}

module.exports = index
