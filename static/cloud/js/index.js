define(function (require, exports, module) {
    var fileType = require("./fileConfig.js");
    console.log(fileType)
    require("layui");
    var $ = require("jquery2");
    var utils = require("utils");
    var ctx = utils.constants.ctx;
    var cloudService = require("bean/cloudService");


    function load() {
        var layer = parent.layui.layer;
        if (layer) {
            layer.load(1, {
                offset: ["54%", "54%"]
            })
        }
    }

    function closeLoad() {
        var layer = parent.layui.layer;
        if (layer) {
            layer.closeAll("loading")
        }
    }

    function throttle(fn, interval) {
        var isRun = true;
        return function () {
            if (!isRun) {
                return
            }
            fn && fn.call(this);
            isRun = false;
            setTimeout(function () {
                isRun = true
            }, interval || 300)
        }
    }(function () {
        load();

        function setHeight() {
            var mainRight = $("#main_Right")[0];
            var content = $("#content")[0];
            var tool = $("#tool")[0];
            var title = $("#title")[0];
            var file = $("#file")[0];
            var footer = $("#footer")[0];
            var imgDiv = $("#file_empty")[0];
            var borderHeight = (file.offsetHeight - file.clientHeight) * 2;
            var contentHeight = mainRight.clientHeight - footer.offsetHeight;
            var topHeight = tool.offsetHeight + title.offsetHeight - 1;
            var fileHeight = contentHeight - topHeight - borderHeight;
            file.style.height = fileHeight + "px";
            if (imgDiv) {
                imgDiv.style.lineHeight = fileHeight + "px"
            }
        }

        function getJson(str, sign, index) {
            var index = index || 0;
            var param = str.substr(index).split(sign);
            return str ? str.substr(index).split(sign) : null
        }
        var title = cloudService.getType();
        if (title.length == 0) {
            closeLoad();
            return
        }
        var map = {};
        var pathStr = null;
        var searchText = null;
        var fullPath = null;
        var search = location.search;
        if (search) {
            var param = getJson(search, "&", 1);
            for (var i in param) {
                var values = getJson(param[i], "=");
                map[values[0]] = values[1]
            }
            searchText = map["search"] ? decodeURIComponent(map["search"]) : null;
            fullPath = map["fullPath"].split(",");
            jsonStr = decodeURIComponent(fullPath.pop());
            pathStr = fullPath.join();
            fullPath.push(JSON.parse(jsonStr))
        } else {
            var obj = {};
            pathStr = title[0].id + "";
            obj[pathStr] = title[0].name;
            searchText = null;
            fullPath = [pathStr, obj]
        }
        cloudService.getFile(pathStr, searchText, function (data) {
            var file = data.result;
            render("all", {
                page: map["page"],
                size: map["limit"],
                pageCount: 5,
                title: title,
                file: file,
                fullPath: fullPath
            });
            setHeight();
            closeLoad()
        });
        window.onresize = throttle(setHeight, 300)
    })();

    function render(name, config) {
        function isAllCheck() {
            var arrCheck = [];
            $(".radio").each(function (index, item) {
                arrCheck.push(item)
            });
            if (arrCheck.length == 0) {
                return false
            }
            if (arrCheck.every(function (item, index) {
                return item.classList.contains("check")
            })) {
                return true
            } else {
                return false
            }
        }

        function menusRender() {
            $("#list_type").html(defaultTypeData.map(function (item, index) {
                return "<li class='type" + (item.id == defaultFullpath[0] ? " active-type" : "") +
                    "' data-id=" + item.id + " data-name=" + item.name + ">" + item.name + "</li>"
            }));
            $(".type").click(function () {
                var id = $(this).attr("data-id");
                var name = $(this).attr("data-name");
                var json = {};
                json[id] = name;
                defaultFullpath = [id, encodeURIComponent(JSON.stringify(json))];
                $(".type").each(function (index, item) {
                    $(item).removeClass("active-type")
                });
                $(this).addClass("active-type");
                location.href = ctx + "/cloud/index/?page=" + 1 + "&limit=" + defaultSize +
                    "&fullPath=" + defaultFullpath.join()
            })
        }

        function fileRender() {
            var tempData = [];
            var start = (defaultPage - 1) * defaultSize;
            var end = defaultPage * defaultSize - 1;

            function reName(cloud, el) {
                cloud.name = el.value;
                cloudService.fileRepeat(cloud, function (data) {
                    var count = data.result;
                    if (count > 0) {
                        layui.layer.confirm("文件名重复，确定使用该文件名？", {
                            btn1: function () {
                                cloud.name = el.value + "(" + count + ")";
                                cloudService.setFileName(cloud);
                                var parentNode = el.parentNode;
                                parentNode.removeChild(el);
                                parentNode.innerHTML += cloud.name
                            },
                            btn2: function () {
                                fileRender()
                            }
                        })
                    } else {
                        var parentNode = el.parentNode;
                        parentNode.removeChild(el);
                        parentNode.innerHTML += cloud.name;
                        cloudService.setFileName(cloud)
                    }
                })
            }
            var fileInner = defaultFileData.map(function (item, index) {
                tempData[item.id] = item;
                if ((start <= index) && (index <= end)) {
                    return ("<li class='file' data-id=" + item.id + " data-name=" + item.name +
                        "><ul class='list-property clearfix'><li class='property option'><label class='radio'></label></li><li class='property name le-out'><img src='" +
                        ctx + fileType[item.suffix] + "'>" + item.name +
                        "</li><li class='property size'>" + (item.size ? item.size : "") +
                        "</li><li class='property time'>" + dateformat(item.editdt) +
                        "</li><li class='property operate le-out'><a class='layui-icon layui-btn layui-btn-xs layui-btn-primary doDown' download=" +
                        item.name +
                        ">下载</a><a class='layui-icon layui-btn layui-btn-xs layui-btn-primary rename' download=" +
                        item.name + ">重命名</a></li></ul></li>")
                }
            }).join("");
            fileInner = fileInner ? fileInner :
                "<div id='file_empty' style='text-align:center'><span><img src='" + ctx +
                "/style/project/cloud/img/empty.png'></span>";
            $("#list_file").html(fileInner);
            var $files = $(".file");
            $files.click(function (e) {
                if (!e.ctrlKey) {
                    $files.each(function (index, item) {
                        $(item).removeClass("file-check");
                        $(this).find(".radio").removeClass("check")
                    })
                }
                $(this).addClass("file-check");
                $(this).find(".radio").addClass("check");
                if (isAllCheck()) {
                    $("#checked_all").addClass("check")
                } else {
                    $("#checked_all").removeClass("check")
                }
                clearInterval(time);
                e.stopPropagation()
            });
            $files.dblclick(function (e) {
                var id = $(this).attr("data-id");
                var name = $(this).attr("data-name");
                if (!tempData[id].suffix) {
                    var json = defaultFullpath.pop();
                    json[id] = name;
                    var str = JSON.stringify(json);
                    defaultFullpath.push(id, encodeURIComponent(str));
                    location.href = ctx + "/cloud/index/?page=" + 1 + "&limit=" + defaultSize +
                        "&fullPath=" + defaultFullpath.join()
                } else {
                    window.open(tempData[id].url)
                }
                e.stopPropagation()
            });
            $(".doDown").click(function (e) {
                var id = $(this).parents(".file").attr("data-id");
                var cloud = tempData[id];
                if (!cloud.suffix) {
                    load();
                    cloudService.getZip(id, function (data) {
                        var url = data.result;
                        if (url) {
                            download(url, cloud.name)
                        } else {
                            layer.msg("下载失败！")
                        }
                        closeLoad()
                    })
                } else {
                    download(cloud.url, cloud.name)
                }
            });
            $(".radio").mousedown(function (e) {
                e.stopPropagation()
            });
            $(".radio").click(function (e) {
                this.classList.toggle("check");
                if (this.classList.contains("check")) {
                    $(this).parents(".file").addClass("file-check")
                } else {
                    $(this).parents(".file").removeClass("file-check")
                }
                if (isAllCheck()) {
                    $("#checked_all").addClass("check")
                } else {
                    $("#checked_all").removeClass("check")
                }
                e.stopPropagation()
            });
            $(".rename").click(function (e) {
                var $file = $(this).parents(".file");
                var $fileName = $file.find(".name");
                var textNode = $fileName[0].childNodes[1];
                var imgSrc = $fileName.find("img").attr("src");
                $fileName.html("<img src='" + imgSrc + "'><input id='newFile' value='" + textNode[
                    "data"] + "' style='width:80%'>");
                defaultFullpath.pop();
                var cloud = {
                    id: $file.attr("data-id"),
                    parentId: defaultFullpath[defaultFullpath.length - 1]
                };
                var oldKey = "";
                $("#newFile").select().mousedown(function (e) {
                    e.stopPropagation()
                }).blur(function () {
                    reName(cloud, this)
                }).keydown(function (e) {
                    if (e.keyCode == 13 && oldKey !== 13) {
                        oldKey = e.keyCode;
                        reName(cloud, this);
                        $(this).unbind("blur")
                    }
                })
            });
            pageRender(defaultFileData.length);
            pathRender(defaultFullpath);
            mouseCheck();
            dragRender(tempData);
            $("#checked_all").removeClass("check")
        }

        function pageRender(length) {
            var pageHtml = "";
            var count = Math.ceil(length / defaultSize);
            switch (true) {
                case count == 0:
                    $("#pager").html(pageHtml);
                    break;
                case defaultPage <= 1:
                    var index = defaultPage;
                    var pageMax = defaultPage + defaultPageCount - 1;
                    pageMax = pageMax <= count ? pageMax : count;
                    while (index <= pageMax) {
                        pageHtml += "<li class='page-index " + (defaultPage === index ? "now" : "") + "'>" +
                            index + "</li>";
                        index++
                    }
                    $("#pager").html(pageHtml + "共" + count + "页");
                    break;
                case (defaultPage + defaultPageCount - 2) <= count:
                    var index = defaultPage - 1;
                    var pageMax = defaultPage + defaultPageCount - 2;
                    while (index <= pageMax) {
                        pageHtml += "<li class='page-index " + (defaultPage === index ? "now" : "") + "'>" +
                            index + "</li>";
                        index++
                    }
                    $("#pager").html(pageHtml + "共" + count + "页");
                    break;
                default:
                    var index = (count - defaultPageCount + 1);
                    index = index <= 0 ? 1 : index;
                    var pageMax = count;
                    while (index <= pageMax) {
                        pageHtml += "<li class='page-index " + (defaultPage === index ? "now" : "") + "'>" +
                            index + "</li>";
                        index++
                    }
                    $("#pager").html(pageHtml + "共" + count + "页");
                    break
            }
            $(".page-index").click(function () {
                var index = Number(this.innerHTML);
                if (defaultPage === index) {
                    return
                }
                defaultFullpath.push(encodeURIComponent(JSON.stringify(defaultFullpath.pop())));
                location.href = ctx + "/cloud/index/?page=" + index + "&limit=" + defaultSize +
                    "&fullPath=" + defaultFullpath.join()
            })
        }

        function pathRender() {
            var tempPath = [].concat(defaultFullpath);
            var json = tempPath.pop();
            $("#full_path").html(tempPath.map(function (item, index) {
                return '<li class="path" data-id="' + item + '"><span class="path-text">' + json[
                    item] + "</span>" + (index == (tempPath.length - 1) ? " " :
                    '<span class="right layui-icon"></span>') + "</li>"
            }).join(""));
            $(".path").click(function () {
                if (defaultFullpath.length <= 2) {
                    return
                }
                var parentId = $(this).attr("data-id");
                var json = defaultFullpath.pop();
                var nowIndex = defaultFullpath.indexOf(parentId);
                defaultFullpath = defaultFullpath.filter(function (item, index, arr) {
                    if (index <= nowIndex) {
                        return true
                    } else {
                        delete json[item]
                    }
                });
                defaultFullpath.push(encodeURIComponent(JSON.stringify(json)));
                location.href = ctx + "/cloud/index?page=" + defaultPage + "&limit=" + defaultSize +
                    "&fullPath=" + defaultFullpath.join()
            })
        }

        function dateformat(t) {
            if (!t) {
                return
            }
            var time = new Date(t);
            var y = time.getFullYear();
            var m = (time.getMonth() + 1) < 10 ? "0" + (time.getMonth() + 1) : (time.getMonth() + 1);
            var d = time.getDate() < 10 ? "0" + time.getDate() : time.getDate();
            return y + "-" + m + "-" + d
        }

        function download(href, title) {
            var a = document.createElement("a");
            a.setAttribute("href", href);
            a.setAttribute("download", title);
            a.click()
        }

        function changeFileSize(size, index) {
            var units = ["kb", "M", "G"];
            index = index || 0;
            size = (size / 1014).toFixed(1);
            if (Math.floor(size / 1014) == 0) {
                return size + units[index]
            } else {
                return changeFileSize(size, ++index)
            }
        }

        function upload() {
            var upload = layui.upload;
            var layer = layui.layer;
            var fileData = defaultFileData;
            var files = {};
            upload.render({
                elem: "#upload_btn",
                url: ctx + "/cloud/fileUpload",
                exts: null,
                accept: "file",
                choose: function (obj, upload) {
                    obj.preview(function (index, file, result) {
                        var tempPath = [].concat(defaultFullpath);
                        tempPath.pop();
                        files.name = file.name;
                        files.size = changeFileSize(file.size);
                        files.parentId = tempPath[tempPath.length - 1];
                        files.isdel = "0";
                        files.fullPath = tempPath.join() + ",";
                        var str = file.name.split(".");
                        files.suffix = str.length > 1 ? str[str.length - 1] : null
                    })
                },
                done: function (res) {
                    files.url = res.fileUrl;
                    cloudService.saveFile(files, function (data) {
                        var cloud = data.result;
                        if (cloud) {
                            fileData.unshift(cloud);
                            fileRender();
                            layer.msg("上传完毕！")
                        } else {
                            layer.msg("上传失败，请联系原开发人员！")
                        }
                    })
                },
                error: function (e) {}
            })
        }

        function clickEvent() {
            $("#back_btn").click(function (e) {
                if (defaultFullpath.length > 2) {
                    history.go(-1)
                }
                e.stopPropagation()
            });
            $("#checked_all").mousedown(function (e) {
                e.stopPropagation()
            });
            $("#checked_all").click(function (e) {
                var $radio = $(".radio");
                if ($radio.length < 1) {
                    return
                }
                this.classList.toggle("check");
                if (this.classList.contains("check")) {
                    $radio.each(function (index, item) {
                        item.classList.add("check");
                        $(item).parents(".file").addClass("file-check")
                    })
                } else {
                    $radio.each(function (index, item) {
                        item.classList.remove("check");
                        $(item).parents(".file").removeClass("file-check")
                    })
                }
                e.stopPropagation()
            });
            $("#new_btn").click(function (e) {
                var tempPath = [].concat(defaultFullpath);
                tempPath.pop();
                var file = {
                    name: "新建文件夹",
                    parentId: tempPath[tempPath.length - 1],
                    isdel: 0,
                    fullPath: tempPath.join() + ","
                };
                newFile(file);
                e.stopPropagation()
            });
            $("#del_btn").mousedown(function (e) {
                e.stopPropagation()
            });
            $("#del_btn").click(function (e) {
                var $fileCheck = $(".file-check");
                var ids = [];
                if ($fileCheck.length == 0) {
                    return
                }
                $fileCheck.each(function (index, item) {
                    ids.push(Number($(item).attr("data-id")))
                });
                layer.confirm("确定删除？删除后数据不可恢复！", {
                    title: "删除确认"
                }, function () {
                    cloudService.delFile(ids, function (data) {
                        var result = data.result;
                        if (result) {
                            defaultFileData = defaultFileData.filter(function (item,
                                                                               index) {
                                return !ids.includes(item.id)
                            });
                            fileRender();
                            layer.msg("删除成功！")
                        } else {
                            layer.msg("遇到一个错误！")
                        }
                    })
                });
                e.stopPropagation()
            });
            $("#search_btn").click(function (e) {
                var str = JSON.stringify(defaultFullpath.pop());
                defaultFullpath.push(encodeURIComponent(str));
                var search = this.previousElementSibling.value.trim();
                if (search) {
                    location.href = ctx + "/cloud/index?search=" + encodeURIComponent(search) +
                        "&limit=" + defaultSize + "&fullPath=" + defaultFullpath.join()
                }
                e.stopPropagation()
            });
            $("#search_Text").keydown(function (e) {
                var search = this.value.trim();
                if (e.key === "Enter" && search) {
                    var str = JSON.stringify(defaultFullpath.pop());
                    defaultFullpath.push(encodeURIComponent(str));
                    location.href = ctx + "/cloud/index?search=" + search + "&page=" + defaultPage +
                        "&limit=" + defaultSize + "&fullPath=" + defaultFullpath.join()
                }
                e.stopPropagation()
            })
        }

        function mouseCheck() {
            var $file = $("#file")[0];
            var $filrList = $("#list_file")[0];
            var $content = $("#content")[0];
            var $mainLeft = $("#main_left")[0];
            var $divMouse = null;
            var body = document.body;
            var startMouse = {};
            var disMouse = {};
            var files = $(".file");

            function isTouch(el, el2) {
                var elRect = el.getBoundingClientRect();
                var el2Rect = el2.getBoundingClientRect();
                if (elRect.left > el2Rect.right || elRect.right < el2Rect.left || elRect.bottom < el2Rect.top ||
                    elRect.top > el2Rect.bottom) {
                    return false
                } else {
                    return true
                }
            }
            var move = function (e) {
                x = Math.max($mainLeft.offsetWidth, e.clientX);
                x = Math.min(innerWidth, x);
                y = Math.min(103.5 + $file.offsetHeight, e.clientY);
                y = Math.max(103.5, y);
                disMouse = {
                    x: x - startMouse.x,
                    y: y - startMouse.y
                };
                $divMouse.css({
                    width: Math.abs(disMouse.x),
                    height: Math.abs(disMouse.y),
                });
                switch (true) {
                    case disMouse.x < 0 && disMouse.y > 0:
                        $divMouse.css({
                            top: startMouse.y,
                            left: "",
                            right: $content.offsetWidth + $mainLeft.offsetWidth - startMouse.x,
                            bottom: ""
                        });
                        break;
                    case disMouse.x > 0 && disMouse.y < 0:
                        $divMouse.css({
                            top: "",
                            left: startMouse.x,
                            right: "",
                            bottom: $content.clientHeight - startMouse.y,
                        });
                        break;
                    case disMouse.x < 0 && disMouse.y < 0:
                        $divMouse.css({
                            top: "",
                            left: "",
                            right: $content.offsetWidth + $mainLeft.offsetWidth - startMouse.x,
                            bottom: $content.clientHeight - startMouse.y,
                        });
                        break;
                    case disMouse.x > 0 && disMouse.y > 0:
                        $divMouse.css({
                            top: startMouse.y,
                            left: startMouse.x,
                            rigth: "",
                            bottom: ""
                        });
                        break
                }
                files.each(function (index, item) {
                    if (isTouch(item, $divMouse[0])) {
                        $(item).addClass("file-check");
                        $(item).find(".radio").addClass("check")
                    } else {
                        $(item).removeClass("file-check");
                        $(item).find(".radio").removeClass("check")
                    }
                });
                if (isAllCheck()) {
                    $("#checked_all").addClass("check")
                } else {
                    $("#checked_all").removeClass("check")
                }
            };
            document.addEventListener("mousedown", function (e) {
                files.each(function (index, item) {
                    $(item).removeClass("file-check");
                    $(item).find(".radio").removeClass("check")
                });
                $("#checked_all").removeClass("check");
                $(body).append("<div class='div-mouse'></div>");
                $divMouse = $(".div-mouse");
                x = Math.max($mainLeft.offsetWidth, e.clientX);
                y = Math.min(103.5 + $file.offsetHeight, e.clientY);
                y = Math.max(103.5, y);
                startMouse = {
                    x: x,
                    y: y
                };
                document.addEventListener("mousemove", move)
            });
            document.addEventListener("mouseup", function (e) {
                document.removeEventListener("mousemove", move);
                $(".div-mouse").remove()
            })
        }

        function dragRender(data) {
            var files = $(".file");
            var body = document.body;
            var moving = body.appendChild(document.createElement("div"));

            function dragMove(e) {
                $(moving).css({
                    top: e.pageY,
                    left: e.pageX + 20
                })
            }

            function drop(e) {
                var isDrop = true;
                var _this = this;
                var ids = [];
                var $fileCheck = $(".file-check");
                $fileCheck.each(function (index, item) {
                    if (item === _this) {
                        isDrop = false
                    }
                    ids.push(Number($(item).attr("data-id")))
                });
                var parentId = $(this).attr("data-id");
                if (!data[parentId].suffix && isDrop) {
                    cloudService.moveFile(ids, parentId, function (data) {
                        if (data.result) {
                            defaultFileData = defaultFileData.filter(function (item, index) {
                                return !ids.includes(item.id)
                            });
                            fileRender();
                            layer.msg("移动成功")
                        } else {
                            layer.msg("移动失败")
                        }
                    })
                }
            }

            function dragStart(e) {
                e.preventDefault();
                e.stopPropagation();
                if (!this.classList.contains("file-check")) {
                    return
                }
                time = setTimeout(function () {
                    var length = $(".file-check").length;
                    $(moving).attr("data-parentId", "");
                    $(moving).html("<img src=" + ctx + "/style/project/cloud/img/dragImg.png>正在移动" +
                        length + "个文件");
                    $(moving).css({
                        position: "absolute",
                        top: e.pageY,
                        left: e.pageX + 20,
                        padding: "5px",
                        color: "rgb(5, 101, 201)",
                        background: "rgb(255, 255, 255, 1)",
                        border: ".5px solid rgb(129, 183, 239)"
                    });
                    $(moving).show();
                    files.each(function (index, item) {
                        item.addEventListener("mouseup", drop)
                    });
                    document.addEventListener("mousemove", dragMove);
                    document.addEventListener("mouseup", function () {
                        $(moving).hide();
                        document.removeEventListener("mousemove", dragMove);
                        files.each(function (index, item) {
                            item.removeEventListener("mouseup", drop)
                        })
                    }, {
                        once: true
                    })
                }, 350)
            }
            files.each(function (index, item) {
                item.addEventListener("mousedown", dragStart)
            })
        }

        function newFile(file) {
            cloudService.saveFile(file, function (data) {
                var cloud = data.result;
                if (cloud) {
                    $("#list_file").prepend(
                        "<li class='file'><ul class='list-property clearfix'><li class='property option'><label class='radio'></label></li><li class='property name le-out'><img src='" +
                        ctx + "/style/project/cloud/img/document.png'><input id='newFile' value='" +
                        cloud.name +
                        "' style='width:80%'></li><li class='property size'></li><li class='property time'>" +
                        dateformat(cloud.editdt) + "</li></ul></li>");
                    $("#newFile").select().blur(function () {
                        cloud.name = this.value;
                        defaultFileData.unshift(cloud);
                        fileRender();
                        cloudService.setFileName(cloud)
                    }).keydown(function (e) {
                        if (e.key === "Enter") {
                            cloud.name = this.value;
                            defaultFileData.unshift(cloud);
                            fileRender();
                            cloudService.setFileName(cloud)
                        }
                    })
                } else {
                    layer.msg("遇到一个错误，请联系原开发人员！")
                }
            })
        }
        var defaultPage = Number(config.page) || 1;
        var defaultSize = Number(config.size) || 20;
        var defaultPageCount = config.pageCount;
        var defaultFullpath = config.fullPath;
        var defaultTypeData = config.title || [];
        var defaultFileData = config.file || [];
        var time = 0;
        if (!defaultFullpath) {
            console.log("缺少路劲defaultFullpath！");
            return "缺少路劲defaultFullpath！"
        }
        if (typeof defaultFullpath !== "object") {
            console.log("defaultFullpath类型错误！");
            return "defaultFullpath类型错误！"
        }
        if (typeof defaultPage !== "number") {
            console.log("defaultPage类型错误！");
            return "defaultPage类型错误！"
        }
        if (typeof defaultSize !== "number") {
            console.log("defaultPize类型错误！");
            return "defaultPize类型错误！"
        }
        if (typeof defaultPageCount !== "number") {
            console.log("defaultPageCount类型错误！");
            return "defaultPageCount类型错误！"
        }
        var event = {
            menus: function () {
                menusRender()
            },
            file: function () {
                fileRender()
            },
            upload: function () {
                upload()
            },
            clickEvent: function () {
                clickEvent()
            },
            "all": function () {
                menusRender();
                fileRender();
                upload();
                clickEvent()
            }
        };
        event[name]()
    }
});