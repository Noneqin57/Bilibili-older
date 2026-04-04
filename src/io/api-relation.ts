import { objUrl } from "../utils/format/url";
import { jsonCheck } from "./api";
import { URLS } from "./urls";

/**
 * 查询当前用户与目标用户的关注关系
 * @param fid 目标用户 mid
 * @returns attribute: 0=未关注, 2=已关注, 6=已互粉, 128=已拉黑
 */
export async function apiRelation(fid: number) {
    const response = await fetch(objUrl(URLS.RELATION, { fid }), {
        credentials: 'include'
    });
    const json = await response.json();
    return <{ mid: number; attribute: number; mtime: number; tag: number[] | null; special: number }>jsonCheck(json).data;
}
