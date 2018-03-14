'use strict'

/**
 * 联合 URL 主要就是把 baseURL 和 操作URL 进行拼接
 * 先判断存在情况再返回内容
 * 当然处理两个 URL 的时候，会处理一下 / 的问题，防止写多，找到不目标
 */
module.exports = function combineURLs (baseURL, relativeURL) {
  return relativeURL
    ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
    : baseURL
}
