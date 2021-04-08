import { ETorrentStatus } from '@/shared/interfaces/enum'
import { AxiosRequestConfig, ResponseType } from 'axios'

export interface SearchResultItemTag {
  color?: string;
  name?: string;
}

export interface ElementQuery {
  // selector或 text 一定要有一个

  text?: string | number, // 当text输入时，会直接返回text，而不进行检查

  /**
   * 如果selector为 string[]， 则会依次尝试并找到第一个成功获取到有效信息的
   * 此外，此处约定了一些特殊的选择器
   *  - :self  该元素自身，对于html文档，一般用于tr自身属性，对于json文档，一般指root顶层
   */
  selector?: string | ':self' | string[],

  attr?: string,
  data?: string,

  // 在获取html innerHtml 前移除内部不需要的元素， 在JSON， attr,data 模式下不适用
  remove?: string | string[],

  filters?: (Function | string)[]
}

// 作为一个种子最基本应该有的属性
export interface Torrent {
  id: number | string;
  title: string; // 主标题
  subTitle?: string; // 次标题

  url: string; // detail 页面
  link: string; // 种子链接

  time?: number; // 发布时间戳（秒级）
  size?: number; // 大小
  author?: number; // 发布人
  category?: string;

  seeders?: number; // 上传数量
  leechers?: number; // 下载数量
  completed?: number; // 完成数量
  comments?: number; // 评论数量

  tags?: SearchResultItemTag[];

  // 对于PT种子才 获取以下部分
  progress?: number; // 进度（100表示完成）
  status?: ETorrentStatus; // 状态
}

export interface searchCategoryOptions {
  name: string,
  value: string | number
}

export interface searchCategories {
  name: string, // 搜索大类名称
  key: string, // 搜索大类
  options: searchCategoryOptions[],
  // 该搜索大类是否允许内部交叉 （ 不声明，则默认不允许（False） ）
  cross?: {
    /**
     * 当允许搜索类别内部交叉时，该搜索类别在请求时字段如何处理，如果是：
     *  - 'raw': 由 axios 自动转化为 &{key}[]={xxx} 的形式 （默认）
     *  - 'append': 转化为 &{key}{xxx}=1 的形式交给 axios 来请求，此时可以通过定义 key 来改写 key
     */
    mode?: 'raw' | 'append'
    key?: string // 当内部交叉时，params与已定义的 key 不一致时使用
  }
}

export interface searchParams {
  /**
   * 约定的特殊key （都以 # 开头）：
   *   - #changeDomain   更换请求的 baseUrl 为 value 值
   */
  key: string,
  value: string | number | string[] | number[]
}

export interface searchFilter {
  keywords: string,
  extraParams?: searchParams[], // 其他请求参数信息
}

export interface SearchRequestConfig {
  filter: searchFilter,
  axiosConfig: AxiosRequestConfig
}

export interface UserInfo {
  id: number | string; // 用户ID
  name: string; // 用户名
  levelName?: string; // 等级名称

  uploaded: number; // 上传量
  downloaded: number; // 下载量
  ratio?: number; // 分享率，Ratio并不是必须获得的，如果站点未提供，助手会使用 uploaded/downloaded 自动计算

  seeding?: number; // 当前做种数量
  seedingSize?: number; // 做种体积
  leeching?: number; // 当前下载数量

  bonus?: number; // 魔力值/积分
  messageCount?: number; // 消息数量
  invites?: number; // 邀请数量

  joinTime?: number; // 入站时间
  avatar?: string; // 头像

  updateAt: number; // 更新时间

  [key: string]: any; // 其他信息
}

export type SiteBaseModule = 'AbstractBittorrentSite' | 'AbstractPrivateSite' | 'NexusPHP'
export type SiteFeature = 'queryUserInfo'

/**
 * 站点配置，这部分配置由系统提供，并随着每次更新而更新，不受用户配置的任何影响
 * 当且仅当 基于模板构建时，该部分配置可以由用户修改
 */
export interface SiteMetadata {
  name: string; // 站点名
  baseModule?: SiteBaseModule;

  description: string; // 站点说明
  tags?: string[];

  url: string; // 完整的网站地址，如果网站支持 `https` ，请优先考虑填写 `https` 的地址

  /**
   * 和url相同作用和写法，唯一不同是将会覆写url的行为（因为url不允许用户编辑）
   * 即，当 legacyUrl 存在时：
   *  - 在搜索中，如果用户设置时未传入 activateUrl ，则使用 legacyUrl[0]
   *  - 在页面中， [url, ...legacyUrl] 效果相同
   */
  legacyUrl?: string[];

  host?: string; // 站点域名，如果不存在，则从url中获取
  formerHosts?: string[]; // 站点过去曾经使用过的域名（现在已不再使用）

  search?: {
    /**
     * 搜索时进行请求，为了避免过于麻烦的配置项
     * 设置了默认的 AxiosRequestConfig 为 { responseType: 'document', url: '/' }
     * 则意味则如果是 json 返回，应该自己覆写 responseType
     */
    requestConfig?: AxiosRequestConfig & { transferPostData?: 'raw' | 'form' | 'params' },

    keywordsParam?: string, // 当不指定且未改写时，会导致keyword未被搜索使用
    categories?: searchCategories[] // 站点对应搜索入口的种子分类信息
    defaultParams?: searchParams[], // 无论如何都会传入的参数
  } // 站点搜索方法如何配置

  detail?: {
    type?: ResponseType, // 当不指定时，默认为 document
  }

  selector?: {
    search?: {
      /**
       * 种子列表定位。 部分选项作用：
       *  - merge  用于合并部分使用多行表示一个种子的情况
       */
      rows?: { selector: string | ':self', merge?: number }
    } & { [torrentKey in keyof Torrent]?: ElementQuery } // 种子相关选择器

    detail?: {
      link?: ElementQuery // 用于获取下载链接不在搜索页，而在详情页的情况
      [key: string]: ElementQuery | undefined // FIXME
    }

    userInfo?: {
      [key: string]: ElementQuery
    }
  }

  feature?: { // 站点支持方法
    [key in SiteFeature]: boolean
  }
}

export interface SiteConfig extends SiteMetadata {
  baseModule: SiteBaseModule;

  activateUrl?: string; // 用户在搜索时使用的地址
  entryPoint?: string; // 用户在options首页点击时，打开的站点地址
}
