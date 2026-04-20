import { apiPageHeader } from "../io/api-page-header";
import { uid } from "../utils/conf/uid";
import { getCookies, setCookie } from "../utils/cookie";
import { addCss, addElement, loadScript } from "../utils/element";
import { subArray } from "../utils/format/subarray";
import { jsonpHook } from "../utils/hook/node";
import { xhrHook } from "../utils/hook/xhr";
import { FetchHook } from "../utils/hook/fetch";
import { poll } from "../utils/poll";
import indexIcon from "../json/index-icon.json";

import cssAvatarAnimation from '../css/avatar-animation.css';
import cssMessage from '../css/message.css';

import { DynamicBannerRenderer } from "../core/banner-render";
import type { BannerConfig } from "../core/banner-render";

const dynamicNewFetchHook = new FetchHook("api.vc.bilibili.com/dynamic_svr/v1/dynamic_svr/dynamic_new");
const iframeJSFetchHook = new FetchHook("/index.");
function isDynamicNavPage(): boolean {
    return location.href.includes('t.bilibili.com/pages/nav/index');
}

export class Header {
    /** locs列表 */
    static locs = [1576, 1612, 1580, 1920, 1584, 1588, 1592, 3129, 1600, 1608, 1604, 1596, 2210, 1634, 142];
    /** 缓存已请求内容 */
    static record: Record<number, ReturnType<typeof apiPageHeader>> = {};
    /** 资源id */
    static get rid() {
        return this.resourceId();
    }
    /** 页面固定的资源id */
    static prid = 0;
    /** tid对照表 */
    static tid = {
        1: 1576,
        13: 1612,
        167: 1920,
        3: 1580,
        129: 1584,
        4: 1588,
        36: 1592,
        160: 1600,
        119: 1608,
        155: 1604,
        165: 1620,
        166: 1620,
        5: 1596,
        23: 1634,
        11: 1616,
        181: 2210,
        177: 2260,
        188: 3129
    }
    /**
     * 根据页面返回resourceId
     * @returns resourceId
     */
    static resourceId() {
        const tid: 13 = (<any>window).bid || (<any>window).tid || (<any>window).topid;
        if (tid) {
            return this.tid[tid] ?? 142;
        }
        if (location.href.includes("v/douga")) return 1576;
        if (location.href.includes("/anime")) return 1612;
        if (location.href.includes("v/music")) return 1580;
        if (location.href.includes("/guochuang")) return 1920;
        if (location.href.includes("v/dance")) return 1584;
        if (location.href.includes("v/game")) return 1588;
        if (location.href.includes("v/knowledge")) return 1592;
        if (location.href.includes("v/tech")) return 3129;
        if (location.href.includes("v/life")) return 1600;
        if (location.href.includes("v/kichiku")) return 1608;
        if (location.href.includes("v/fashion")) return 1604;
        if (location.href.includes("v/ent")) return 1596;
        if (location.href.includes("v/cinephile")) return 2210;
        if (location.href.includes("/cinema")) return 1634;
        return 142;
    }
    /** 顶栏分区 */
    static primaryMenu() {
        poll(() => document.querySelector("#primary_menu"), d => {
            const vue = (<any>d).__vue__;
            vue.menuList.forEach((d: any, i: number, s: any) => {
                switch (d.name) {
                    case "动画":
                        s[i].sub = [{ "name": "MAD·AMV", "route": "mad", "tid": 24, "ps": 15, "rps": 10, "ad": { "active": true, "dataLocId": 151 }, "desc": "具有一定制作程度的动画或静画的二次创作视频", "url": "//www.bilibili.com/video/douga-mad-1.html" }, { "name": "MMD·3D", "route": "mmd", "tid": 25, "ps": 15, "rps": 10, "ad": { "active": true, "dataLocId": 152 }, "desc": "使用MMD（MikuMikuDance）和其他3D建模类软件制作的视频", "url": "//www.bilibili.com/video/douga-mmd-1.html" }, { "name": "短片·手书·配音", "route": "voice", "tid": 47, "ps": 15, "rps": 10, "desc": "追求创新并具有强烈特色的短片、手书（绘）及ACG相关配音", "url": "//www.bilibili.com/video/douga-voice-1.html" }, { "name": "手办·模玩", "route": "garage_kit", "tid": 210, "ps": 15, "rps": 10, "desc": "手办模玩的测评、改造或其他衍生内容", "url": "" }, { "name": "特摄", "route": "tokusatsu", "tid": 86, "ps": 15, "rps": 10, "desc": "特摄相关衍生视频", "url": "//www.bilibili.com/video/cinephile-tokusatsu.html" }, { "name": "综合", "route": "other", "tid": 27, "ps": 15, "rps": 10, "ad": { "active": true, "dataLocId": 153 }, "desc": "以动画及动画相关内容为素材，包括但不仅限于音频替换、杂谈、排行榜等内容", "url": "//www.bilibili.com/video/douga-else-1.html" }];
                        break;
                    case "音乐":
                        s[i].sub = [{ "name": "原创音乐", "route": "original", "tid": 28, "ps": 15, "rps": 10, "viewHotTag": true, "ad": { "active": true, "dataLocId": 243 }, "dpConfig": [{ "name": "一日", "value": 1 }, { "name": "三日", "value": 3 }], "desc": "原创歌曲及纯音乐，包括改编、重编曲及remix", "url": "//www.bilibili.com/video/music-original-1.html" }, { "name": "翻唱", "route": "cover", "tid": 31, "ps": 15, "rps": 10, "ad": { "active": true, "dataLocId": 245 }, "viewHotTag": true, "dpConfig": [{ "name": "一日", "value": 1 }, { "name": "三日", "value": 3 }], "desc": "对曲目的人声再演绎视频", "url": "//www.bilibili.com/video/music-Cover-1.html" }, { "name": "演奏", "route": "perform", "tid": 59, "ps": 15, "rps": 10, "viewHotTag": true, "dpConfig": [{ "name": "一日", "value": 1 }, { "name": "三日", "value": 3 }], "desc": "乐器和非传统乐器器材的演奏作品", "url": "//www.bilibili.com/video/music-perform-1.html" }, { "name": "VOCALOID·UTAU", "route": "vocaloid", "tid": 30, "ps": 15, "rps": 10, "viewHotTag": true, "ad": { "active": true, "dataLocId": 247 }, "dpConfig": [{ "name": "一日", "value": 1 }, { "name": "三日", "value": 3 }], "desc": "以VOCALOID等歌声合成引擎为基础，运用各类音源进行的创作", "url": "//www.bilibili.com/video/music-vocaloid-1.html" }, { "name": "音乐现场", "route": "live", "tid": 29, "ps": 15, "rps": 10, "viewHotTag": true, "dpConfig": [{ "name": "一日", "value": 1 }, { "name": "三日", "value": 3 }], "desc": "音乐表演的实况视频，包括官方/个人拍摄的综艺节目、音乐剧、音乐节、演唱会等", "url": "//www.bilibili.com/video/music-oped-1.html" }, { "name": "MV", "route": "mv", "tid": 193, "ps": 15, "rps": 10, "viewHotTag": true, "dpConfig": [{ "name": "一日", "value": 1 }, { "name": "三日", "value": 3 }], "desc": "为音乐作品配合拍摄或制作的音乐录影带（Music Video），以及自制拍摄、剪辑、翻拍MV", "url": "//www.bilibili.com/video/music-coordinate-1.html" }, { "name": "乐评盘点", "route": "commentary", "tid": 243, "ps": 15, "rps": 10, "viewHotTag": true, "dpConfig": [{ "name": "一日", "value": 1 }, { "name": "三日", "value": 3 }], "desc": "音乐类新闻、盘点、点评、reaction、榜单、采访、幕后故事、唱片开箱等", "url": "//www.bilibili.com/video/music-collection-1.html" }, { "name": "音乐教学", "route": "tutorial", "tid": 244, "ps": 15, "rps": 10, "viewHotTag": true, "dpConfig": [{ "name": "一日", "value": 1 }, { "name": "三日", "value": 3 }], "desc": "以音乐教学为目的的内容", "url": "//www.bilibili.com/video/music-collection-1.html" }, { "name": "音乐综合", "route": "other", "tid": 130, "ps": 15, "rps": 10, "viewHotTag": true, "dpConfig": [{ "name": "一日", "value": 1 }, { "name": "三日", "value": 3 }], "desc": "所有无法被收纳到其他音乐二级分区的音乐类视频", "url": "//www.bilibili.com/video/music-collection-1.html" }, { "name": "音频", "customZone": "Audio", "route": "audio", "url": "//www.bilibili.com/audio/home?musicType=music" }, { "name": "说唱", "url": "//www.bilibili.com/v/rap" }];
                        break;
                    case "科技":
                        s[i].name = "知识";
                        s[i].route = "knowledge";
                        s[i].sub = [{ "name": "科学科普", "route": "science", "tid": 201, "ps": 15, "rps": 10, "ad": { "active": true, "dataLocId": 261 }, "desc": "回答你的十万个为什么" }, { "name": "社科·法律·心理", "route": "social_science", "tid": 124, "ps": 15, "rps": 10, "ad": { "active": true, "dataLocId": 263 }, "desc": "基于社会科学、法学、心理学展开或个人观点输出的知识视频" }, { "name": "人文历史", "route": "humanity_history", "tid": 228, "ps": 15, "rps": 10, "desc": "看看古今人物，聊聊历史过往，品品文学典籍" }, { "name": "财经商业", "route": "business", "tid": 207, "ps": 15, "rps": 10, "desc": "说金融市场，谈宏观经济，一起畅聊商业故事" }, { "name": "校园学习", "route": "campus", "tid": 208, "ps": 15, "rps": 10, "ad": { "active": true, "dataLocId": 265 }, "desc": "老师很有趣，学生也有才，我们一起搞学习" }, { "name": "职业职场", "route": "career", "tid": 209, "ps": 15, "rps": 10, "desc": "职业分享、升级指南，一起成为最有料的职场人" }, { "name": "设计·创意", "route": "design", "tid": 229, "ps": 15, "rps": 10, "desc": "天马行空，创意设计，都在这里" }, { "name": "野生技能协会", "route": "skill", "tid": 122, "ps": 15, "rps": 10, "desc": "技能党集合，是时候展示真正的技术了" }];
                        break;
                    case "数码":
                        s[i].name = "科技";
                        s[i].route = "tech";
                        s[i].sub = [{ "name": "数码", "route": "digital", "tid": 95, "ps": 15, "rps": 10, "viewHotTag": true, "desc": "科技数码产品大全，一起来做发烧友", "url": "#" }, { "name": "软件应用", "route": "application", "tid": 230, "ps": 15, "rps": 10, "viewHotTag": true, "desc": "超全软件应用指南", "url": "#" }, { "name": "计算机技术", "route": "computer_tech", "tid": 231, "ps": 15, "rps": 10, "viewHotTag": true, "desc": "研究分析、教学演示、经验分享......有关计算机技术的都在这里", "url": "#" }, { "name": "科工机械", "route": "industry", "tid": 232, "ps": 15, "rps": 10, "viewHotTag": true, "desc": "从小芯片到大工程，一起见证科工力量", "url": "#" }, { "name": "极客DIY", "route": "diy", "tid": 233, "ps": 15, "rps": 10, "viewHotTag": true, "desc": "炫酷技能，极客文化，硬核技巧，准备好你的惊讶", "url": "#" }];
                        break;
                    case "生活":
                        s[i].sub = [{ "name": "搞笑", "route": "funny", "tid": 138, "ps": 15, "rps": 10, "ad": { "active": true, "dataLocId": 273 }, "desc": "各种沙雕有趣的搞笑剪辑，挑战，表演，配音等视频", "url": "//www.bilibili.com/video/ent_funny_1.html", "locid": 4204, "recommendId": 4210, "slider": { "width": 620, "height": 220 }, "customComponent": { "name": "Energy", "leftId": 4212, "rightId": 4218, "rightType": "slide" } }, { "name": "家居房产", "route": "home", "tid": 239, "ps": 15, "rps": 10, "ad": { "active": true, "dataLocId": 275 }, "desc": "与买房、装修、居家生活相关的分享", "url": "#" }, { "name": "手工", "route": "handmake", "tid": 161, "ps": 15, "rps": 10, "desc": "手工制品的制作过程或成品展示、教程、测评类视频", "url": "//www.bilibili.com/video/ent-handmake-1.html" }, { "name": "绘画", "route": "painting", "tid": 162, "ps": 15, "rps": 10, "desc": "绘画过程或绘画教程，以及绘画相关的所有视频", "url": "//www.bilibili.com/video/ent-painting-1.html" }, { "name": "日常", "route": "daily", "tid": 21, "ps": 15, "rps": 10, "desc": "记录日常生活，分享生活故事", "url": "//www.bilibili.com/video/ent-life-1.html" }];
                        break;
                    case "鬼畜":
                        s[i].sub = [{ "name": "鬼畜调教", "route": "guide", "tid": 22, "ps": 15, "rps": 10, "ad": { "active": true, "dataLocId": 285 }, "desc": "使用素材在音频、画面上做一定处理，达到与BGM一定的同步感", "url": "//www.bilibili.com/video/ent-Kichiku-1.html" }, { "name": "音MAD", "route": "mad", "tid": 26, "ps": 15, "rps": 10, "ad": { "active": true, "dataLocId": 287 }, "desc": "使用素材音频进行一定的二次创作来达到还原原曲的非商业性质稿件", "url": "//www.bilibili.com/video/douga-kichiku-1.html" }, { "name": "人力VOCALOID", "route": "manual_vocaloid", "tid": 126, "ps": 15, "rps": 10, "desc": "将人物或者角色的无伴奏素材进行人工调音，使其就像VOCALOID一样歌唱的技术", "url": "//www.bilibili.com/video/kichiku-manual_vocaloid-1.html" }, { "name": "鬼畜剧场", "route": "theatre", "tid": 216, "ps": 15, "rps": 10, "desc": "使用素材进行人工剪辑编排的有剧情的作品" }, { "name": "教程演示", "route": "course", "tid": 127, "ps": 10, "rps": 6, "rightComponent": { "name": "CmImgList", "id": 148 }, "ad": { "active": true, "dataLocId": 289 }, "hideDropdown": false, "desc": "鬼畜相关的教程演示", "url": "//www.bilibili.com/video/kichiku-course-1.html" }];
                        break;
                    case "时尚":
                        s[i].sub = [{ "name": "美妆护肤", "route": "makeup", "tid": 157, "ps": 15, "rps": 10, "ad": { "active": true, "dataLocId": 279 }, "desc": "彩妆护肤、美甲美发、仿妆、医美相关内容分享或产品测评", "url": "//www.bilibili.com/video/fashion-makeup-fitness-1.html" }, { "name": "穿搭", "route": "clothing", "tid": 158, "ps": 15, "rps": 10, "ad": { "active": true, "dataLocId": 281 }, "desc": "穿搭风格、穿搭技巧的展示分享，涵盖衣服、鞋靴、箱包配件、配饰（帽子、钟表、珠宝首饰）等", "url": "//www.bilibili.com/video/fashion-clothing-1.html" }, { "name": "时尚潮流", "route": "trend", "tid": 159, "ps": 15, "rps": 10, "desc": "时尚街拍、时装周、时尚大片，时尚品牌、潮流等行业相关记录及知识科普", "url": "#" }];
                        break;
                    case "广告":
                        s[i].name = "资讯";
                        s[i].route = "information";
                        s[i].tid = 202;
                        s[i].sub = [{ "name": "热点", "route": "hotspot", "tid": 203, "ps": 18, "rps": 10, "desc": "全民关注的时政热门资讯" }, { "name": "环球", "route": "global", "tid": 204, "ps": 18, "rps": 10, "desc": "全球范围内发生的具有重大影响力的事件动态" }, { "name": "社会", "route": "social", "tid": 205, "ps": 18, "rps": 10, "desc": "日常生活的社会事件、社会问题、社会风貌的报道" }, { "name": "综合", "route": "multiple", "tid": 206, "ps": 18, "rps": 10, "desc": "除上述领域外其它垂直领域的综合资讯" }];
                        break;
                    case "娱乐":
                        s[i].sub = [{ "name": "综艺", "route": "variety", "tid": 71, "ps": 15, "rps": 10, "ad": { "active": true, "dataLocId": 267 }, "desc": "所有综艺相关，全部一手掌握！", "url": "//www.bilibili.com/video/ent-variety-1.html" }, { "name": "娱乐杂谈", "route": "talker", "tid": 241, "ps": 15, "rps": 10, "ad": { "active": true, "dataLocId": 269 }, "desc": "娱乐人物解读、娱乐热点点评、娱乐行业分析" }, { "name": "粉丝创作", "route": "fans", "tid": 242, "ps": 15, "rps": 10, "desc": "粉丝向创作视频" }, { "name": "明星综合", "route": "celebrity", "tid": 137, "ps": 15, "rps": 10, "desc": "娱乐圈动态、明星资讯相关" }];
                        break;
                }
            });
        });
        this.plaza();
        this.indexIcon();
        this.styleFix();
    }
    static banner() {
        jsonpHook.async('api.bilibili.com/x/web-show/res/loc', url => {
            const rid = this.rid;
            this.record[rid] || (this.record[rid] = apiPageHeader({ resource_id: rid }));
            return true;
        }, async url => {
            const obj = new URL(url);
            const rid = this.rid;

            obj.searchParams.delete("callback");
            url = obj.toJSON();
            Header.prid && (url.includes(String(Header.prid)) || (url = url.replace('ids=', `ids=${Header.prid}%2C`)));

            const loc = await fetch(url).then(d => d.json());
            const header = await this.record[rid];
            if (loc.data) {
                this.locs.forEach(d => {
                    loc.data[d] && (loc.data[d][0].pic = (header && header.pic) || "//i0.hdslb.com/bfs/activity-plat/static/20171220/68a052f664e8414bb594f9b00b176599/images/90w1lpp6ry.png",
                        loc.data[d][0].litpic = (header && header.litpic),
                        loc.data[d][0].url = (header && header.url) || "",
                        loc.data[d][0].title = (header && header.name) || "");
                    if (url.includes("loc?") && obj.searchParams.get("id") == String(d)) {
                        loc.data[0].pic = (header && header.pic) || "//i0.hdslb.com/bfs/activity-plat/static/20171220/68a052f664e8414bb594f9b00b176599/images/90w1lpp6ry.png";
                        loc.data[0].litpic = (header && header.litpic) || "";
                        loc.data[0].url = (header && header.url) || "";
                        loc.data[0].title = (header && header.name) || "";
                    }
                });
            }
            // 尝试渲染动态 Banner
            if (header) {
                this.renderDynamicBanner(header);
            }
            return loc;
        }, false);
    }
    /** 动态 Banner 渲染器实例 */
    private static dynamicBannerRenderer: DynamicBannerRenderer | null = null;
    protected static renderDynamicBanner(header: { is_split_layer?: number; split_layer?: string }) {
        if (!this.dynamicBanner) {
            return;
        }
        if (header.is_split_layer !== 1 || !header.split_layer) {
            return;
        }

        try {
            const splitLayer = JSON.parse(header.split_layer);
            if (splitLayer?.version !== '1' || !Array.isArray(splitLayer?.layers)) {
                return;
            }

            const bannerConfig: BannerConfig = {
                type: 'multi-layer',
                multiLayer: {
                    version: 2,
                    layers: splitLayer.layers
                }
            };

            poll(() => document.querySelector<HTMLElement>('#banner_link'), (bannerEl) => {
                if (this.dynamicBannerRenderer) {
                    this.dynamicBannerRenderer.dispose();
                }
                this.dynamicBannerRenderer = new DynamicBannerRenderer();
                this.dynamicBannerRenderer.render(bannerEl, bannerConfig);

                bannerEl.style.backgroundImage = 'none';
                bannerEl.style.backgroundColor = 'transparent';

                addCss(`
                    .dynamic-banner-wrapper {
                        position: absolute;
                        top: 0; left: 0; width: 100%; height: 100%;
                    }
                    .dynamic-banner-wrapper .layer {
                        position: absolute;
                        left: 0; top: 0;
                        height: 100%; width: 100%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .dynamic-banner-wrapper .layer img,
                    .dynamic-banner-wrapper .layer video,
                    .dynamic-banner-wrapper .layer canvas {
                        user-select: none;
                        pointer-events: none;
                        -webkit-user-drag: none;
                    }
                `, 'dynamic-banner-styles');
            });
        } catch (e) {
            console.error('[Header] 解析动态 Banner 数据失败:', e);
        }
    }
    /** 顶栏广场 */
    protected static plaza() {
        jsonpHook.async("api.bilibili.com/plaza/banner", () => true, async () => {
            return { "code": 0, "result": [{ "link": "https://www.bilibili.com/blackboard/x/act_list", "end": 1640966407, "begin": 1456709887, "title": "bilibili 活动", "cover": "http://i0.hdslb.com/bfs/square/6830d0e479eee8cc9a42c3e375ca99a5147390cd.jpg", "id": 9, "created_ts": 1491386053 }, { "link": "http://www.bilibili.com/blackboard/topic_list.html", "end": 1640966418, "begin": 1544258598, "title": "话题列表", "cover": "http://i0.hdslb.com/bfs/square/b1b00a0c3ce8570b48277ae07a2e55603a4a4ddf.jpg", "id": 17, "created_ts": 1491386030 }] }
        }, false);
    }
    // 已失效 2023-09-18
    /** 顶栏动图 */
    protected static indexIcon() {
        jsonpHook.async("api.bilibili.com/x/web-interface/index/icon", undefined, async () => {
            return {
                code: 0,
                data: subArray(indexIcon.fix),
                message: "0",
                ttl: 1
            }
        }, false);
    }
    /** 消息页面样式 */
    static message() {
        addCss(cssMessage, "message");
    }
    /** 顶栏动态记录参数失效，另行找补 */
    static videoOffset() {
        if (uid) {
            const offset = getCookies()[`bp_video_offset_${uid}`];
            if (offset) {
                setCookie(`bp_t_offset_${uid}`, offset);
            }
        }
    }
    /** 迷你顶栏 */
    protected miniHeader() {
        this.oldHeader.classList.remove('has-menu');
    }
    /** 是否mini顶栏 */
    protected static isMiniHead(d?: HTMLElement) {
        // 各种分区主页一律使用mini顶栏
        if (/\/v\/(douga|music|dance|game|knowledge|tech|life|kichiku|fashion|information|ent|cinephile|car|sports|animal)\//.test(location.href)) return true;
        // 公开课使用mini顶栏
        if (/\/mooc\//.test(location.href)) return true;
        return (
            location.href.includes("blackboard/topic_list")
            || location.href.includes("blackboard/x/act_list")
            || document.querySelector(".large-header")
            || document.querySelector(".bili-banner")
            || (d?.getAttribute("type") == "all")
        ) ? false : true;
    }
    constructor() {
        if (isDynamicNavPage()) {
            this.injectDynamicNavFix();
            return;
        }
        this.oldHeader.className = 'z-top-container has-menu';
        this.hookHeadV2();
        this.feedCount();
        poll(() => document.readyState === 'complete', () => this.styleClear());
    }

    /** 动态面板API注入 */
    private dynamicNavObserver: MutationObserver | null = null;
    private dynamicNavPatchedComponents = new WeakSet<any>();

    protected injectDynamicNavFix() {
        Header.fetchEntrance();

        xhrHook.async('dynamic_svr/v1/dynamic_svr/dynamic_num', undefined, async () => {
            try {
                await Header.fetchEntrance();
                const count = Header.dynamicNewCounts.video;
                const response = JSON.stringify({ code: 0, message: 'OK', ttl: 1, data: { new_num: count, update_num: count } });
                return { response, responseText: response };
            } catch {
                const response = '{"code":0,"message":"OK","ttl":1,"data":{"new_num":0,"update_num":0}}';
                return { response, responseText: response };
            }
        }, true);

        this.hookDynamicNewWithNewCount();
        this.patchApiHandler();
    }

    protected hookDynamicNewWithNewCount() {
        const key = '__biliOldDynamicNewHooked__';
        if ((window as any)[key]) return;
        (window as any)[key] = true;

        const patchPayload = (payload: any, isArticle: boolean) => {
            if (!payload?.data?.cards) return false;
            const serverCount = Number(payload.data.new_count);
            const safeServerCount = Number.isFinite(serverCount) && serverCount >= 0 ? serverCount : 0;
            let targetCount = safeServerCount;

            if (isArticle) {
                // 专栏防污染
                Header.dynamicNewCounts.article = safeServerCount;
            } else {
                targetCount = Header.dynamicNewCounts.video;
            }

            const limit = Array.isArray(payload.data.cards) ? payload.data.cards.length : 50;
            const normalized = Math.max(0, Math.min(50, limit, Math.floor(targetCount || 0)));
            payload.data.new_count = normalized;
            payload.data.num = normalized;
            return true;
        };

        const originalFetch = window.fetch;
        window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
            const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
            if (!url.includes('dynamic_svr/v1/dynamic_svr/dynamic_new')) {
                return originalFetch.call(window, input, init);
            }

            await Header.fetchEntrance();
            const response = await originalFetch.call(window, input, init);
            try {
                const payload = await response.clone().json();
                const isArticle = url.includes('type_list=64') || url.includes('type_list=%36%34');
                patchPayload(payload, isArticle);
                return new Response(JSON.stringify(payload), {
                    status: response.status,
                    statusText: response.statusText,
                    headers: response.headers,
                });
            } catch {
                return response;
            }
        };

        const owner = this;
        const originalOpen = XMLHttpRequest.prototype.open;
        const originalSend = XMLHttpRequest.prototype.send;

        XMLHttpRequest.prototype.open = function(method: string, url: string | URL, async?: boolean, username?: string | null, password?: string | null) {
            (this as any).__biliOldUrl = String(url);
            return originalOpen.call(this, method, url, async ?? true, username ?? null, password ?? null);
        };

        XMLHttpRequest.prototype.send = function(body?: any) {
            const url = (this as any).__biliOldUrl as string;
            if (url?.includes('dynamic_svr/v1/dynamic_svr/dynamic_new')) {
                this.addEventListener('readystatechange', async function() {
                    if (this.readyState !== 4 || this.status !== 200) return;
                    try {
                        await Header.fetchEntrance();
                        const payload = JSON.parse(this.responseText);
                        const isArticle = url.includes('type_list=64') || url.includes('type_list=%36%34');
                        if (!patchPayload(payload, isArticle)) return;
                        const content = JSON.stringify(payload);
                        Object.defineProperty(this, 'responseText', { configurable: true, value: content });
                        Object.defineProperty(this, 'response', { configurable: true, value: content });
                        setTimeout(() => owner.patchApiHandler(), 0);
                    } catch (error) {
                        console.error('[Bilibili-Old] XHR hook error:', error);
                    }
                });
            }
            return originalSend.call(this, body);
        };
    }

    protected patchApiHandler() {
        const patchVm = (vm: any) => {
            if (!vm) return;

            if (typeof vm.apiHandler === 'function' && !this.dynamicNavPatchedComponents.has(vm)) {
                this.patchComponentApiHandler(vm);
                this.dynamicNavPatchedComponents.add(vm);
            }

            if (Array.isArray(vm.$children)) {
                vm.$children.forEach((child: any) => patchVm(child));
            }
        };

        document.querySelectorAll('.dyn_list_wrapper').forEach((wrapper) => {
            patchVm((wrapper as any).__vue__);
        });

        ['#app-container', '#app', '#root', 'body'].forEach((selector) => {
            const vm = (document.querySelector(selector) as any)?.__vue__;
            patchVm(vm);
        });

        if (!this.dynamicNavObserver) {
            this.dynamicNavObserver = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                    for (const node of mutation.addedNodes) {
                        if (!(node instanceof Element)) continue;
                        const wrapper = node.classList.contains('dyn_list_wrapper') ? node : node.querySelector('.dyn_list_wrapper');
                        if (wrapper) patchVm((wrapper as any).__vue__);
                    }
                }
            });
            this.dynamicNavObserver.observe(document.body, { childList: true, subtree: true });
        }
    }

    protected patchComponentApiHandler(vm: any) {
        const owner = this;
        const originalApiHandler = vm.apiHandler.bind(vm);

        vm.apiHandler = function(t: any, e?: any) {
            const result = originalApiHandler(t, e);
            owner.syncDynamicSplit(vm, t);
            return result;
        };

        if (!owner.isArticleDynamicVm(vm) && !(vm.apiHandler as any).__fixed__) {
            (vm.apiHandler as any).__fixed__ = true;
            setTimeout(() => {
                vm.firstTime = false;
                if (typeof vm.loadVideoDataNew === 'function') {
                    vm.loadVideoDataNew();
                }
            }, 100);
        }

        (vm.apiHandler as any).__patched__ = true;
    }

    protected syncDynamicSplit(vm: any, response: any) {
        if (!Array.isArray(vm?.list)) return;
        const fromResponse = Number(response?.data?.new_count);
        const fromVm = Number(vm?.newCount);
        const fallbackCount = this.getDynamicFallbackCount(vm);
        const rawCount = Number.isFinite(fromResponse) && fromResponse >= 0
            ? fromResponse
            : (Number.isFinite(fromVm) && fromVm >= 0 ? fromVm : fallbackCount);
        if (!Number.isFinite(rawCount)) return;

        const count = Math.max(0, Math.min(50, vm.list.length, Math.floor(rawCount)));
        vm.newCount = count;
        vm.firstTime = false;
        vm.newList = vm.list.slice(0, count);
        vm.historyList = vm.list.slice(count, 50);
    }

    protected getDynamicFallbackCount(vm: any): number {
        return this.isArticleDynamicVm(vm) ? 0 : Header.dynamicNewCounts.video;
    }

    protected isArticleDynamicVm(vm: any): boolean {
        return typeof vm?.loadArticleDataNew === 'function';
    }

    protected hookHeadV2() {
        poll(() => {
            return document.querySelector<HTMLElement>('#internationalHeader')
                || document.querySelector<HTMLElement>('#biliMainHeader')
                || document.querySelector<HTMLElement>('#bili-header-container')
                || document.querySelector<HTMLElement>('#home_nav')
                || document.querySelector<HTMLElement>('.bili-header__bar')
        }, d => {
            Header.isMiniHead(d) && this.miniHeader();
            this.loadOldHeader(d);
        });
        // 远古顶栏
        poll(() => document.querySelector<HTMLElement>('.z_top_container'), d => {
            this.loadOldHeader(d);
            document.querySelector<HTMLElement>('.header')!.style.display = 'none';
        })
        // poll(() => document.querySelector<HTMLElement>('.international-footer'), d => this.loadOldFooter(d));
        // poll(() => document.querySelector<HTMLElement>('#biliMainFooter'), d => this.loadOldFooter(d));
    }
    /** 已加载旧版顶栏 */
    protected oldHeadLoaded = false;
    /** 旧版顶栏节点 */
    protected oldHeader = document.createElement('div');
    /** 加载旧版顶栏 */
    protected loadOldHeader(target?: HTMLElement) {
        if (target) {
            if (target.className === 'bili-header__bar') {
                addCss('.bili-header.large-header,.header-channel,.z-top-container.has-menu[type="all"] {display: none;}');
            }
            document.body.classList.remove('header-v3');
            target.style.display = 'none';
            target.hidden = true;
            // target.attachShadow({ mode: 'closed' });
        }
        if (this.oldHeadLoaded) return;
        this.oldHeadLoaded = true;
        addCss('#internationalHeader,#biliMainHeader,#bili-header-container{display: none;}');
        document.body.insertBefore(this.oldHeader, document.body.firstChild);
        ((<any>window).jQuery ? Promise.resolve() : loadScript("//static.hdslb.com/js/jquery.min.js"))
            .then(() => loadScript("//s1.hdslb.com/bfs/seed/jinkela/header/header.js"))
            .then(() => { Header.styleFix(); });
        Header.primaryMenu();
        Header.banner();
    }
    protected loadOldFooter(target?: HTMLElement) {
        addElement('div', { class: "footer bili-footer report-wrap-module" }, document.body, undefined, undefined, target);
        ((<any>window).jQuery ? Promise.resolve() : loadScript("//static.hdslb.com/js/jquery.min.js"))
            .then(() => loadScript("//static.hdslb.com/common/js/footer.js"))
            .then(() => {
                target && (target.style.display = 'none');
                this.styleClear();
                addCss('.bili-footer {position: relative;}');
                document.getElementsByClassName('bili-header-m')[1]?.remove();
            })
    }
    static dynamicBanner = false;
    /** 顶栏样式修复 */
    protected static styleFix() {
        addCss(".nav-item.live {width: auto;}.lt-row {display: none !important;} .bili-header-m #banner_link{background-size: cover;background-position: center !important;}", 'lt-row-fix');
        addCss(cssAvatarAnimation, "avatarAnimation");
        // 使用 backdrop-filter 给 nav-mask 加模糊，替代 blur-bg
        addCss('.nav-menu .blur-bg{display: none !important;}', 'hide-blur-bg');
        addCss('.nav-menu .nav-mask{background: rgba(255,255,255,0.4) !important; backdrop-filter: blur(4px) !important; -webkit-backdrop-filter: blur(20px) !important;}', 'nav-mask-blur');
    }
    /** 禁用新版顶栏相关样式 */
    protected async styleClear() {
        const d = document.styleSheets;
        for (let i = 0; i < d.length; i++) {
            d[i].href?.includes("laputa-header") && (d[i].disabled = true);
        }
        Header.styleFix();
    }
    /** 缓存 entrance 数据 */
    static dynamicNewCounts: Record<string, number> = { video: 0, article: 0, live: 0 };
    static entrancePromise: Promise<void> | null = null;
    /** 预调 entrance API */
    static fetchEntrance(): Promise<void> {
        if (Header.entrancePromise) return Header.entrancePromise;
        Header.entrancePromise = fetch("https://api.bilibili.com/x/web-interface/dynamic/entrance?alltype_offset=0&video_offset=0&article_offset=0&web_location=333.1007", { credentials: "include" })
            .then(r => r.json())
            .then(json => {
                const newCount = json?.data?.update_info?.item?.count ?? 0;
                Header.dynamicNewCounts.video = Math.max(Header.dynamicNewCounts.video, newCount);
            }).catch(() => { Header.entrancePromise = null; });
        return Header.entrancePromise;
    }

    /** 顶栏动态直播回复数目接口失效，强制标记为0 */
    protected feedCount() {
        Header.fetchEntrance();
        xhrHook.async('api.live.bilibili.com/ajax/feed/count', undefined, async () => {
            const response = '{ "code": 0, "data": { "count": 0 }, "message": "0" }';
            return { response, responseText: response }
        }, false);
        // 修复动态角标
        let dynamicNumCalled = false;
        xhrHook.async('dynamic_svr/v1/dynamic_svr/dynamic_num', undefined, async () => {
            if (dynamicNumCalled) {
                const response = '{"code":0,"message":"OK","ttl":1,"data":{"new_num":0,"update_num":0}}';
                return { response, responseText: response };
            }
            dynamicNumCalled = true;
            try {
                const res = await fetch('https://api.bilibili.com/x/web-interface/dynamic/entrance?alltype_offset=0&video_offset=0&article_offset=0&web_location=333.1007', {
                    credentials: 'include'
                });
                const json = await res.json();
                const count: number = json?.data?.update_info?.item?.count ?? 0;
                const response = JSON.stringify({ code: 0, message: 'OK', ttl: 1, data: { new_num: count, update_num: count } });
                return { response, responseText: response };
            } catch {
                const response = '{"code":0,"message":"OK","ttl":1,"data":{"new_num":0,"update_num":0}}';
                return { response, responseText: response };
            }
        }, true);

        this.hookIframeJS();
        this.hookDynamicNew();
    }
    /** 修复动态面板历史分割线 */
    protected hookIframeJS() {
        // 使用提前初始化的 FetchHook 拦截 JS 文件
        iframeJSFetchHook.response(async (res) => {
            try {
                let js = await res.text();
                if (!js) return;
                const originalPattern = /void 0 === this\.firstTime \|\| !0 === this\.firstTime \|\| I \? \(this\.newList = this\.list\.slice\(0, 50\), this\.historyList = \[\]\) : \(this\.newList = this\.list\.slice\(0, 50\)\.slice\(0, this\.newCount \|\| 0\)\.slice\(0, 50\), this\.historyList = this\.list\.slice\(this\.newCount \|\| 0\)\.slice\(0, 50 - this\.newList\.length\)\)/;
                if (originalPattern.test(js)) {
                    const replacement = 'var _newCount = (t && t.data && t.data.new_count) || this.newCount || 0; this.newList = this.list.slice(0, 50).slice(0, _newCount).slice(0, 50), this.historyList = this.list.slice(_newCount).slice(0, 50 - this.newList.length)';
                    js = js.replace(originalPattern, replacement);
                    return js;
                }
            } catch (e) {
                console.error('[Bilibili-Old] Failed to patch iframe JS:', e);
            }
        });
    }

    protected hookDynamicNew() {
        // 使用提前初始化的 FetchHook 设置响应拦截
        dynamicNewFetchHook.response(async (res) => {
            const url = res.url;
            const isArticle = url.includes("type_list=64") || url.includes("type_list=%36%34");

            // 等待 entrance 数据就绪
            await Header.fetchEntrance();

            const response = await res.json();

            if (response?.data?.cards) {
                const apiCount = Number(response.data.new_count);
                const safeApiCount = Number.isFinite(apiCount) && apiCount >= 0 ? apiCount : 0;
                const newCount = isArticle ? safeApiCount : Header.dynamicNewCounts.video;
                if (isArticle) Header.dynamicNewCounts.article = safeApiCount;
                response.data.new_count = newCount;
                response.data.num = newCount;
            }

            return JSON.stringify(response);
        });
    }

}
