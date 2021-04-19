define(function(require, exports, module) {
    function buildData(cb) {
        var _this = this;
        new Promise(function(reslove, reject) {
            var reg = /y-modal=['"](\S+)['"]/gm;
            var res = _this.$dom.innerHTML.match(reg);
            var local = _this.$config.data || {};
            for (var property of res) {
                var o = local;
                var keyStr = property.replace(reg, "$1");
                var keyArr = keyStr.split(".");
                var key = keyArr.shift();
                while (key) {
                    if (keyArr.length == 0) {
                        o[key] = o[key] || ""
                    } else {
                        o[key] = o[key] || {};
                        o = o[key]
                    }
                    key = keyArr.shift()
                }
            };
            reslove(_this.$data = local)
        }).then(function(data) {
            cb(data)
        })
    };

    function complie() {
        var _this = this;
        var tags = _this.$tags.join();
        var data = _this.$data;
        var reg = /y-modal=['"](\S+)['"]/gm;
        _this.$tagDom = _this.$dom.querySelectorAll(tags);
        _this.$tagDom.forEach(function(item) {
            var keyAtrr = item.outerHTML.match(reg);
            if (!keyAtrr) return;
            var keyStr = keyAtrr[0].replace(reg, "$1");
            item.onchange = listen.bind(_this, item, keyStr);
            new Watch(data, keyStr, function(newValue) {
                if (newValue !== item.value) item.value = newValue
            })
        })
    };

    function obServer(data, keys) {
        var keys = keys || Object.keys(data);
        keys.forEach(function(key) {
            if (Object.prototype.toString.call(data[key]) === "[object Object]") {
                obServer(data[key])
            } else {
                var dep = new Dep();
                let value = data[key];
                Object.defineProperty(data, key, {
                    configurable: true,
                    enumerable: true,
                    get: function() {
                        if (Dep.target) dep.addSub(Dep.target);
                        return value
                    },
                    set: function(newValue) {
                        dep.notify(newValue);
                        if (newValue !== value) value = newValue
                    }
                })
            }
        })
    };

    function Dep() {
        this.subs = []
    };
    Dep.prototype.addSub = function(sub) {
        this.subs.push(sub)
    };
    Dep.prototype.notify = function(newValue) {
        this.subs.forEach(function(sub) {
            sub.update(newValue)
        })
    };

    function Watch(data, keyStr, cb) {
        Dep.target = this;
        var keyArr = keyStr.split(".");
        for (var key of keyArr) {
            data = data[key]
        }
        cb(data);
        this.cb = cb;
        Dep.target = null
    };
    Watch.prototype.update = function(newValue) {
        this.cb(newValue)
    };

    function listen(item, keyStr) {
        var data = this.$data;
        var keyArr = keyStr.split(".");
        var key = keyArr.shift();
        while (key) {
            if (keyArr.length == 0) {
                data[key] = item.value
            }
            data = data[key];
            key = keyArr.shift()
        };
        return this.$validtor(item, data)
    };

    function Yue(config, cb) {
        if (typeof config.els === "object") this.$dom = config.els;
        else if (typeof config.els === "string") this.$dom = document.getElementById(config.els);
        else this.$dom = {};
        this.$tags = config.tags || ["input", "textarea", "select"];
        this.$config = config;
        this.$init();
        cb && setTimeout(cb.bind(this, this))
    };
    Yue.prototype.$init = function() {
        var _this = this;
        buildData.call(_this, function(data) {
            obServer(data);
            complie.call(_this)
        })
    };
    Yue.prototype.$setData = function(local, outside) {
        var _this = this;
        var keys = Object.keys(outside || {});
        keys.forEach(function(key) {
            if (Object.prototype.toString.call(outside[key]) === "[object Object]") {
                _this.$setData(local[key], outside[key])
            } else {
                local[key] = outside[key];
                obServer(local, [key])
            }
        })
    };
    Yue.prototype.$validtor = function(item, value) {
        var result = [];
        if (item) {
            var reg = /y-valid=['"](\S+)['"]/gm;
            var validAttr = item.outerHTML.match(reg);
            if (!validAttr) return true;
            var validStr = validAttr[0].replace(reg, "$1");
            var resList = validStr.split("|");
            for (var name of resList) {
                this.$valids[name] && result.push(this.$valids[name](item, value))
            }
        } else {
            var tagDom = this.$tagDom;
            for (var d of tagDom) {
                result.push(d.onchange())
            }
        }
        item = null;
        return result.every(function(isPass) {
            return isPass
        })
    };
    Yue.prototype.$appendValid = function(k, fn, m) {
        this.$valids[k] = function(o, v) {
            var h = o.nextElementSibling.innerHTML;
            var r = fn.call(this, o, v);
            if (r) {
                o.nextElementSibling.innerHTML = h.replace(m, "")
            } else {
                o.nextElementSibling.innerHTML = m
            }
            return r
        }
    };
    Yue.prototype.$valids = {
        empty: function(o, v) {
            var m = "请填写信息,不能为空!";
            var h = o.nextElementSibling.innerHTML;
            if (v) {
                o.nextElementSibling.innerHTML = h.replace(m, "");
                return true
            } else {
                o.nextElementSibling.innerHTML = m;
                return false
            }
        },
        number: function(o, v) {
            var r = /\D+/g;
            var m = "请填写数字,内容格式不正确!";
            var h = o.nextElementSibling.innerHTML;
            if (!r.test(v)) {
                o.nextElementSibling.innerHTML = h.replace(m, "");
                return true
            } else {
                o.nextElementSibling.innerHTML = m;
                return false
            }
        },
        phone: function(o, v) {
            if (!v) return;
            var r = /^[1]([3-9])[0-9]{9}$/;
            var m = "请填写格式正确的手机号码!";
            var h = o.nextElementSibling.innerHTML;
            if (r.test(v)) {
                o.nextElementSibling.innerHTML = h.replace(m, "");
                return true
            } else {
                o.nextElementSibling.innerHTML = m;
                return false
            }
        },
        email: function(o, v) {
            if (!v) return;
            var r = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
            var m = "请填写格式正确的邮箱!";
            var h = o.nextElementSibling.innerHTML;
            if (r.test(v)) {
                o.nextElementSibling.innerHTML = h.replace(m, "");
                return true
            } else {
                o.nextElementSibling.innerHTML = m;
                return false
            }
        }
    };
    module.exports = Yue
});