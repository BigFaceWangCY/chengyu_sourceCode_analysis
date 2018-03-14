### 目录结构

```
.
├── adapters                      // 用于网络相关的适配器
│   ├── http.js
│   └── xhr.js
├── axios.js                      // axios 主文件
├── cancel                        // 取消服务
│   ├── Cancel.js
│   ├── CancelToken.js
│   └── isCancel.js
├── core                          // 核心代码
│   ├── Axios.js
│   ├── InterceptorManager.js
│   ├── createError.js
│   ├── dispatchRequest.js
│   ├── enhanceError.js
│   ├── settle.js
│   └── transformData.js
├── defaults.js                   // 默认的配置文件
├── helpers                       // 一些辅助的的功能函数
│   ├── bind.js
│   ├── btoa.js
│   ├── buildURL.js
│   ├── combineURLs.js
│   ├── cookies.js
│   ├── deprecatedMethod.js
│   ├── isAbsoluteURL.js
│   ├── isURLSameOrigin.js
│   ├── normalizeHeaderName.js
│   ├── parseHeaders.js
│   └── spread.js
└── utils.js                      // 常用的辅助函数
```