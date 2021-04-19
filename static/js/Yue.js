	
;define(function (require, exports, module) {  
     
/*****************核心部分(buildData, setData, complie, observer, Dep, Watch, listen)***************/
    //数据结构构建
    function buildData() {
        var reg = /y-modal=['"](\S+)['"]/gm;
        var res = this.$dom.innerHTML.match(reg);
        for (var property of res) {
            var o = this.$data;
            var d = this.$config.data;
            var keyStr = property.replace(reg, "$1");
            var keyArr = keyStr.split(".");
            var key = keyArr.shift();
            while (key){
                if(keyArr.length == 0) {
                    o[key] = null
                } else {
                    o[key] = {};
                    o = o[key];
                }
                key = keyArr.shift();
            }
        };
    }
    //渲染数据
    function setData(local, outside) {
        var keys = Object.keys(local);
        keys.forEach(function (key) {
            if(Object.prototype.toString.call(local[key]) === "[object Object]"){
                outside[key]&&setData(local[key], outside[key]);
            } else {
                outside[key]&&(function() {
                    local[key] = outside[key];
                })();
            }
        });
    };
    //编译
    function complie() {
        var _this  = this;
        var tags   = _this.$tags.join();
        var data   = _this.$data;
        var reg    = /<(.*)(y-modal=['"](.*?)['"])(.*)>/g;
        _this.$tagDom = _this.$dom.querySelectorAll(tags);
        _this.$tagDom.forEach(function(item){
            var keyStr = item.outerHTML.replace(reg, "$3");
            if(!keyStr)return;
            item.onchange = listen.bind(_this, item, keyStr);//item.value数据流向data
            new Watch(data, keyStr, function(newValue){//data数据流向item.value
                if(newValue !== item.value)
                    item.value = newValue;
            });
        });
    };
    //数据劫持(观察者模式)
    function obServer(data) {
        var keys = Object.keys(data);
        keys.forEach(function (key) {
            if(Object.prototype.toString.call(data[key]) === "[object Object]"){
                obServer(data[key]);
            } else {
                var dep = new Dep();
                let value = data[key];
                Object.defineProperty(data,key,{
                    configurable:true,//允许可配置
                    enumerable:true,//允许可枚举
                    get: function () {
                        if(Dep.target){
                            dep.addSub(Dep.target);
                        }
                        return value;
                    },
                    set: function (newValue) {
                        dep.notify(newValue);
                        if(newValue !== value)
                            value = newValue;
                    }
                });
            }
        });
    };
    //订阅者管理器
    function Dep() {
        this.subs = [];
    };
    Dep.prototype.addSub = function (sub) {
        this.subs.push(sub);
    };
    Dep.prototype.notify = function (newValue) {
        this.subs.forEach(function(sub) {
            sub.update(newValue);
        });
    };
    //订阅者
    function Watch(data, keyStr, cb) {
        this.cb = cb;
        Dep.target = this;
         
        var keyArr = keyStr.split(".");
        for(var key of keyArr){
            data = data[key];
        }
        Dep.target = null;
    };
    Watch.prototype.update = function (newValue) {
        this.cb(newValue);
    };
    //监听器
    function listen(item, keyStr) {
        var data = this.$data;
        var keyArr = keyStr.split(".");
        var key = keyArr.shift();
        while (key){
            if(keyArr.length == 0) {
                data[key] = item.value
            }
            data = data[key];
            key = keyArr.shift();
        };
        return this.validtor(item, data);
    };
/*****************核心部分(buildData, setData, complie, observer, Dep, Watch, listen)***************/
    function Yue(config, cb) {
        this.$tags   = config.tags || ["input","textarea","select"];
        this.$dom    = document.getElementById(config.els);
        this.$config = config;
        this.$data   = {};
        this.init();
        cb&&setTimeout(cb.bind(this));
        return this;
    };
    Yue.prototype.init = function () {
        buildData.call(this);//扫描y-modal构造数据模型(Modal)
        obServer(this.$data);//数据劫持(ViewModal)
        complie.call(this);//编译,给特定组件(比如带有y-modal就是特定主键,可扩展)添加订阅者(View)
        if(this.$config.data)setData(this.$data, this.$config.data);//填充数据并渲染数据
    };
    Yue.prototype.validtor = function(item, value) {
        var reg = /<(.*)(y-valid=['"](.*?)['"])(.*)>/g;
        var result = [];
        if (item) {
            var res = item.outerHTML.replace(reg, "$3");
            var resList = res.split("|");
            for (var name of resList) {
                this.valids[name] && result.push(this.valids[name](item, value));
            }
        } else {
            var tagDom = this.$tagDom;
            for(var d of tagDom) {
                result.push(d.onchange());
            }
        }
        item = null;
        return result.every(function(item){return item;});
    };
    Yue.prototype.valids = {
        empty: function (o, v) {
            var m = "请填写信息,不能为空!";
            var h = o.nextElementSibling.innerHTML;
            if (v) {
                o.nextElementSibling.innerHTML = h.replace(m,"");;
                return true;
            } else {
                o.nextElementSibling.innerHTML = m;
                return false;
            }
        },
        number: function (o, v) {
            var r = /\D+/g;
            var m = "请填写数字,内容格式不正确!";
            var h = o.nextElementSibling.innerHTML;
            if(!r.test(v)){
                o.nextElementSibling.innerHTML = h.replace(m,"");
                return true;
            } else {
                o.nextElementSibling.innerHTML = m;
                return false;
            }
        },
        phone: function (o, v) {
            if(!v)return;
            var r = /^[1]([3-9])[0-9]{9}$/;
            var m = "请填写格式正确的手机号码!";
            var h = o.nextElementSibling.innerHTML;
            if (r.test(v)) {
                o.nextElementSibling.innerHTML = h.replace(m,"");
                return true;
            } else {
                o.nextElementSibling.innerHTML = m;
                return false;
            }
        },
        email: function (o, v) {
            if(!v)return;
            var r = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
            var m = "请填写格式正确的邮箱!";
            var h = o.nextElementSibling.innerHTML;
            if(r.test(v)){
                o.nextElementSibling.innerHTML = h.replace(m,"");
                return true;
            } else {
                o.nextElementSibling.innerHTML = m;
                return false;
            }
        }
    };
    module.exports = Yue;
});
