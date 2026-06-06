# 通用组件使用文档

## 1. Loading 加载组件

当 Dennis 的爬虫还没抓到数据时，显示加载动画，避免白屏。

### 引入组件

在页面的 `.json` 文件中引入：

```json
{
  "usingComponents": {
    "loading": "/components/loading/loading"
  }
}
```

### 基础用法

```html
<!-- 在 WXML 中使用 -->
<loading show="{{loading}}" />
```

### 自定义文案

```html
<loading
  show="{{loading}}"
  text="正在加载排行榜..."
  hint="首次加载可能需要几秒钟"
/>
```

### 属性说明

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| show | Boolean | false | 是否显示加载组件 |
| text | String | '加载中...' | 加载文案 |
| hint | String | '' | 提示文案（可选） |

### 完整示例

```javascript
// pages/home/home.js
Page({
  data: {
    loading: true,
    dataList: []
  },

  onLoad() {
    this.fetchData()
  },

  fetchData() {
    this.setData({ loading: true })

    request.get('/api/ranking')
      .then(data => {
        this.setData({
          dataList: data,
          loading: false
        })
      })
      .catch(err => {
        this.setData({ loading: false })
      })
  }
})
```

```html
<!-- pages/home/home.wxml -->
<view>
  <!-- 加载状态 -->
  <loading
    show="{{loading}}"
    text="加载战队数据中..."
    hint="正在从 LeetCode 同步最新数据"
  />

  <!-- 数据列表 -->
  <view wx:if="{{!loading && dataList.length > 0}}">
    <!-- 渲染数据 -->
  </view>
</view>
```

---

## 2. Empty 空状态组件

当没有数据时，显示友好的空状态页面。

### 引入组件

在页面的 `.json` 文件中引入：

```json
{
  "usingComponents": {
    "empty": "/components/empty/empty"
  }
}
```

### 基础用法

```html
<!-- 在 WXML 中使用 -->
<empty show="{{isEmpty}}" />
```

### 自定义内容

```html
<empty
  show="{{isEmpty}}"
  icon="📊"
  text="暂无战队数据"
  description="快去完成 LeetCode 题目吧！"
/>
```

### 带按钮操作

```html
<empty
  show="{{isEmpty}}"
  icon="🔍"
  text="暂无排行数据"
  description="可能是数据还在同步中，请稍后刷新"
  showButton="{{true}}"
  buttonText="刷新数据"
  buttonType="primary"
  bind:action="handleRefresh"
/>
```

### 属性说明

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| show | Boolean | false | 是否显示空状态组件 |
| icon | String | '📭' | 图标（Emoji 或符号） |
| image | String | '' | 图片路径（优先于 icon） |
| text | String | '暂无数据' | 主文案 |
| description | String | '' | 描述文案（可选） |
| showButton | Boolean | false | 是否显示按钮 |
| buttonText | String | '刷新' | 按钮文案 |
| buttonType | String | 'primary' | 按钮类型：primary / secondary |

### 事件说明

| 事件名 | 说明 | 回调参数 |
|--------|------|----------|
| action | 按钮点击事件 | - |

### 完整示例

```javascript
// pages/home/home.js
Page({
  data: {
    loading: false,
    isEmpty: false,
    dataList: []
  },

  onLoad() {
    this.fetchData()
  },

  fetchData() {
    this.setData({ loading: true, isEmpty: false })

    request.get('/api/ranking')
      .then(data => {
        this.setData({
          dataList: data,
          loading: false,
          isEmpty: data.length === 0
        })
      })
      .catch(err => {
        this.setData({
          loading: false,
          isEmpty: true
        })
      })
  },

  handleRefresh() {
    this.fetchData()
  }
})
```

```html
<!-- pages/home/home.wxml -->
<view>
  <!-- 加载状态 -->
  <loading show="{{loading}}" text="加载中..." />

  <!-- 空状态 -->
  <empty
    show="{{!loading && isEmpty}}"
    icon="📊"
    text="暂无战队数据"
    description="快去完成 LeetCode 题目，数据会自动同步！"
    showButton="{{true}}"
    buttonText="刷新数据"
    bind:action="handleRefresh"
  />

  <!-- 数据列表 -->
  <view wx:if="{{!loading && !isEmpty}}">
    <block wx:for="{{dataList}}" wx:key="id">
      <!-- 渲染数据 -->
    </block>
  </view>
</view>
```

---

## 3. 常见使用场景

### 场景 1：排行榜页面

```html
<!-- 三种状态：加载中、空状态、有数据 -->
<loading show="{{loading}}" text="加载排行榜..." />

<empty
  wx:if="{{!loading && rankList.length === 0}}"
  show="{{true}}"
  icon="🏆"
  text="暂无排行数据"
  description="战队成员完成题目后会显示在这里"
  showButton="{{true}}"
  buttonText="刷新"
  bind:action="fetchLeaderboard"
/>

<view wx:if="{{!loading && rankList.length > 0}}">
  <!-- 排行榜列表 -->
</view>
```

### 场景 2：战报页面

```html
<loading
  show="{{loading}}"
  text="加载战报数据..."
  hint="正在从 LeetCode 同步最新提交记录"
/>

<empty
  wx:if="{{!loading && totalSolved === 0}}"
  show="{{true}}"
  icon="📈"
  text="还没有刷题记录"
  description="完成第一道题目后，这里会显示你的学习趋势"
/>

<view wx:if="{{!loading && totalSolved > 0}}">
  <!-- 图表数据 -->
</view>
```

### 场景 3：组合使用

```javascript
Page({
  data: {
    status: 'loading' // loading / empty / success / error
  },

  fetchData() {
    this.setData({ status: 'loading' })

    request.get('/api/data')
      .then(data => {
        this.setData({
          status: data.length > 0 ? 'success' : 'empty'
        })
      })
      .catch(() => {
        this.setData({ status: 'error' })
      })
  }
})
```

```html
<loading show="{{status === 'loading'}}" />

<empty
  show="{{status === 'empty'}}"
  text="暂无数据"
/>

<empty
  show="{{status === 'error'}}"
  icon="⚠️"
  text="加载失败"
  description="网络异常或服务器错误"
  showButton="{{true}}"
  buttonText="重试"
  bind:action="fetchData"
/>

<view wx:if="{{status === 'success'}}">
  <!-- 正常内容 -->
</view>
```

---

## 4. 推荐的图标 Emoji

根据不同场景选择合适的图标：

- **加载中**：⏳ 🔄 ⌛️
- **空数据**：📭 📪 🗂️ 📊 📈
- **无搜索结果**：🔍 🔎
- **无消息**：💬 📨 ✉️
- **无收藏**：⭐️ 💛 ❤️
- **无排行**：🏆 🥇 👑
- **错误**：⚠️ ❌ 🚫
- **成功**：✅ ✓ 🎉

---

## 5. 样式自定义

如果需要调整样式，可以在页面的 `.wxss` 中覆盖组件样式：

```css
/* 自定义加载文案颜色 */
loading .loading-text {
  color: #FFA116;
}

/* 自定义空状态图标大小 */
empty .empty-icon {
  font-size: 160rpx;
}

/* 自定义空状态容器最小高度 */
empty .empty-container {
  min-height: 600rpx;
}
```
