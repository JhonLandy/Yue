    const Koa = require("koa");
    const KoaBody = require("koa-body")
    const Views = require("koa-views");
    const Static = require("koa-static");
    const Router = require("koa-router");
    const data = require("./data.json");
    const fs = require("fs");

    let app = new Koa();
    let router = new Router();

    app.use(KoaBody())
    app.use(Views(__dirname + "/view"),{
        extension:"html"
    });
    app.use(Static(__dirname + "/static"));

    router.get("/chapterAdd", async ctx => {
        await ctx.render("chapterAdd");
    });
    router.get("/getData",async ctx => {
        ctx.body = JSON.stringify(data);
    });
    router.get("/cloud/index",async ctx => {
        await ctx.render("cloud");
    });
    router.post("/saveData", ctx => {
        data.push(ctx.request.body);
        fs.writeFile("data.json", JSON.stringify(data),err => {
            if(err){
                console.log(err);
            } else {
                console.log("保存数据成功");
            }
        })
        ctx.body = "保存成功";
    })
    app.use(router.routes());
    app.listen(4000);
