# 表单插件

## How to use simplelly?

### html
```html
<form class="chapter-form" id="formChapter" enctype="application/x-www-form-urlencoded">
  ....
</form>
```

### javascript
```js
const Yue = require("./Yue.js")//sea.js模块化语法，使用时请注意

const form = new Yue({
  els: 'formChapter'
})
const submmitBtn = document.querySeletor("#sumbit")

submmitBtn.click = () => {
  const isPass = form.validtor()//提交时，触发表单验证
  if (isPass) {
    //todo
  }
}
```

### 演示效果
- 演示操作
```bash
git clone https://github.com/JhonLandy/Yue.git
npm install
nodemon index
```
open <a href="#">127.0.0.1:4000/chapterAdd</a>
- 点击提交按钮

![验证2](/验证2.jpg)

- 正在输入内容，当失去焦点时，也触发验证

![验证1](/验证1.jpg)

## 功能

### 验证规则
如果你要验证手机号码、邮箱，只要在html中这样使用即可
```html
<input class="chapter-input" y-valid="phone|email" maxlength="255">
```
如果只想验证手机号码
```html
<input class="chapter-input" y-valid="phone" maxlength="255">
```
如果你想要更多验证规则验证，可以在js脚本里这样定义：
```js
from.valids['customer'] = function() {
  if (true) {
    return true//验证通过返回true，否则false
  }
}
```

### 数据绑定
just like the Vue.和vue的v-modal指令一样的
```html
<input class="chapter-input" y-modal="chapterItem" y-valid="empty" maxlength="255">
```
会自动生成数据的属性`chapterItem`
```js
const form = new Yue({
  els: 'formChapter'
})
console.log(form.$data)// {chapterItem: null}
```
### 有内置样式提供使用（基于flex布局）
- 按钮
  1. chapter-btn-normal（一般按钮样式）
  2. chapter-btn-group（一组按钮）
  3. chapter-btn（基础样式）
- 表单组件（input,select等）
  1. chapter-form（表单）
  2. chapter-group（一组组件）
  3. chapter-row（一行的组件排列样式）
  4. chapter-input
  5. chapter-textarea 
  
## 核心源码
```js
Yue.prototype.init = function () {
    buildData.call(this);//扫描y-modal构造数据模型(Modal)
    obServer(this.$data);//数据劫持(ViewModal)
    complie.call(this);//编译,给特定组件(比如带有y-modal就是特定主键,可扩展)添加订阅者(View)
    if(this.$config.data)setData(this.$data, this.$config.data);//填充数据并渲染数据
};
```
<a href="/static/js/Yue.js">源码地址</a>
