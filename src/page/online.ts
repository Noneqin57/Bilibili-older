import { urlCleaner } from "../core/url";
import { Header } from "./header";
import { Page } from "./page";
import { addCss } from "../utils/element";
import onlineHtml from '../html/online.html';

export class PageOnline extends Page {
    constructor() {
        super(onlineHtml);
        urlCleaner.updateLocation(location.origin + '/online.html');
        Header.primaryMenu();
        Header.banner();
        this.updateDom();
        this.fixStyle();
    }
    private fixStyle() {
        addCss('.online-list .ebox .lazy-img { height: auto !important; }', 'online-lazy-img');
        addCss('.nav-item.profile-info .i-face .face { margin-top: 6px; }', 'online-avatar-fix');
    }
        protected loadedCallback() {
        super.loadedCallback();
        document.title = '当前在线 - 哔哩哔哩 (゜-゜)つロ 干杯~-bilibili';
        //不延时小心给你跳404
        window.addEventListener('load', () => {
            history.replaceState(null, '', 'online');
        });
    }
}
