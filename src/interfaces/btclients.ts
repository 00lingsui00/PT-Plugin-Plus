/**
 * 所有支持的客户端种类（新增客户端请在此处注册）
 * 对应 v1.x 版本的 type 项
 */
export type clientType =
  'qbittorrent'
  | 'utorrent'
  | 'deluge'
  | 'transmission'
  | 'synologyDownloadStation'
  | 'ruTorrent'
  | 'flood'

/**
 * 客户端配置信息
 */
export interface TorrentClientConfig {
  /**
   * UUIDv4，去掉短连接线剩下部分
   */
  uuid: string;

  type: clientType;

  /**
   * 客户端名称
   * The name of client which can help users recognise it quickly
   */
  name: string;

  /**
   * The full url of torrent client webapi, like:
   *    - transmission:  http://ip:port/transmission/rpc
   *    - qbittorrent:   http://ip:port/
   */
  address: string;

  username?: string;
  password?: string;

  /**
   * request timeout
   */
  timeout?: number;
}

/**
 * 客户端介绍信息
 */
export interface TorrentClientMetaData {
  description?: string; // 客户端介绍
  warning?: string[]; // 用于配置时显示的警告信息，要用于一些特殊提示

  allowCustomPath: boolean; // 是否允许自定义目录，默认为 false
  pathDescription?: string; // 自定义目录说明
}

export class NotSupportError extends Error {
}

/**
 * 客户端具体要实现的抽象方法
 */
export interface TorrentClient {
  // 实现的版本号 x.y.z 格式，目前暂无特别用处
  version: string;

  config: TorrentClientConfig;

  // 检查客户端是否可以连接
  ping: () => Promise<boolean>;

  // 获取种子信息的方法
  getAllTorrents: () => Promise<Torrent[]>
  getTorrentsBy: (filter: TorrentFilterRules) => Promise<Torrent[]>
  getTorrent: (id: any) => Promise<Torrent>;

  // 添加种子
  addTorrent: (url: string, options?: Partial<AddTorrentOptions>) => Promise<boolean>;

  // 暂停种子
  pauseTorrent: (id: any) => Promise<boolean>;

  // 恢复种子
  resumeTorrent: (id: any) => Promise<boolean>;

  // 删除种子
  removeTorrent: (id: any, removeData?: boolean) => Promise<boolean>;
}

// 获得到的种子实例
export interface Torrent {
  id: string | number;
  infoHash: string;

  name: string;

  /**
   * progress percent out of 100
   */
  progress: number;
  isCompleted: boolean;

  /**
   * 1:1 is 1, half seeded is 0.5
   */
  ratio: number;

  /**
   * date as iso string
   */
  dateAdded: string;

  savePath: string;
  label?: string;
  state: TorrentState;

  /**
   * total size of the torrent, in bytes
   */
  totalSize: number;
}

export enum TorrentState {
  downloading = 'downloading',
  seeding = 'seeding',
  paused = 'paused',
  queued = 'queued',
  checking = 'checking',
  error = 'error',
  unknown = 'unknown',
}

// 种子筛选方法
export interface TorrentFilterRules {
  ids?: any;
  complete?: boolean;
}

// 添加种子
export interface AddTorrentOptions {
  /**
   * 是否本地下载
   */
  localDownload: boolean;

  /**
   * 是否将种子置于暂停状态
   */
  addAtPaused: boolean;

  /**
   * 种子下载地址
   */
  savePath: string;

  /**
   * called a label in some clients and a category in others
   * Notice: Some clients didn't support it
   */
  label?: string;
}
