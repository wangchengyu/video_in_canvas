const MAX_KEY_FRAME = 20;
const CLIP_RATIO = 0.25;

const VIDEO_WIDTH = 800;
const VIDEO_HEIGHT = 450;

const THUMB_WIDTH = 160;
const THUMB_HEIGHT = 100;
const THUMB_COUNT = 20;
const THUMB_SMALL_WIDTH = VIDEO_WIDTH / THUMB_COUNT;

const TIME_LABEL_HEIGHT = 30;
const TIME_LABEL_WIDTH = 40;

const INDEX_MARGIN_WIDTH = 2;


function timeFormat(seconds) {
    let numberFormat = (num) => (num > 10 ? "" : "0") + num.toFixed(1); // 2.3 => 02.3

    if (seconds < 60)
        return "00:" + numberFormat(seconds)

    return numberFormat(Math.floor(seconds / 60)) + ":" + numberFormat(seconds - Math.floor(seconds / 60) * 60)
}

class KeyFrame {
    constructor(canvas, video) {
        this.updated = false;
        this.leaved = true;

        this.jm = null;
        this.canvas = canvas;
        this.video = video;
        this.ctx = this.canvas.getContext('2d');
        canvas.style.cursor = 'col-resize';

        this.mouseMoveEvent = null;
        this.tl_list = []; // time label list "00:00.0 , 01:00.0 ..." just 6 labels in it.

        this.itp_list = []; // time point list "0, 1, 2.2, ..." for each preview image
        this.image_list = [];

        this.float_preview_div = document.createElement('div');
        this.float_preview_img = document.createElement('img');

        this.initFloatPreview(this.float_preview_div, this.float_preview_img);

        this.cover_div = document.createElement("div");

        this.initCoverDiv(this.cover_div);

        // bind event
        canvas.addEventListener("mouseenter", this.canvasMouseEnter());
        canvas.addEventListener("mouseleave", this.canvasMouseLeave());
        canvas.addEventListener("mousemove", this.canvasMouseMove());
        canvas.addEventListener("mousedown", this.canvasMouseDown());

        video.addEventListener("loadeddata", this.videoOnLoadedData());
    }

    initFloatPreview(div, img) {
        document.body.appendChild(div);
        div.appendChild(img);
        div.style.cssText =
            "display:none;" +
            "position:absolute;" +
            "width:160px;" +
            "height:90px;" +
            "border: #F00 solid 2px;" +
            "border-radius: 5px;";

        img.style.cssText = "width:100%;height:100%;border-radius: inherit;";
    }

    initCoverDiv(div) {
        const video = this.video;

        video.parentNode.appendChild(div);
        div.innerHTML = "LOADING VIDEO ...";
        div.style.cssText =
            "width:100%;" +
            "height:100%;" +
            "background-color:white;" +
            "position:relative;" +
            "color:black;" +
            "text-align:center;" +
            "line-height:300px;" +
            "font-size:24px;";

    }

    initPreviewImages(imgs, itp, tl) {
        imgs = imgs || this.image_list;
        itp = itp || this.itp_list;
        tl = tl || this.tl_list;

        for (let i = 0; i < MAX_KEY_FRAME; i++) {
            imgs[i] = document.createElement("IMG");
            itp[i] = video.duration / 20 * i;
        }

        // time labels
        tl.push("00:00");
        tl.push(timeFormat(video.duration / 5));
        tl.push(timeFormat(video.duration / 5 * 2));
        tl.push(timeFormat(video.duration / 5 * 3));
        tl.push(timeFormat(video.duration / 5 * 4));
        tl.push(timeFormat(video.duration));

    }


    hideElement(el) {
        el.setAttribute("old_display", el.style.display);
        el.style.display = "none";

    }

    showElement(el) {
        el.style.display = el.getAttribute("old_display") ? el.getAttribute("old_display") : "block";
    }

    canvasMouseEnter() {
        const that = this;

        return (event) => {
            that.showElement(that.float_preview_div);
            that.leaved = false;
            that.updated = true;
        }
    }

    canvasMouseLeave() {
        const that = this;

        return (event) => {
            that.hideElement(that.float_preview_div);
            that.leaved = true;
            that.updated = true;
        }
    }

    canvasMouseMove() {
        const that = this;

        return (event) => {
            that.mousemoveEvent = event;
            that.updated = true;
        }
    }

    canvasMouseDown() {
        const that = this;
        return (event) => {
            that.video.currentTime = that.video.duration * event.layerX / VIDEO_WIDTH;
            that.updated = true;
        }
    }

    videoOnLoadedData() {
        console.log("video is loading...");

        const that = this;
        const video = that.video;
        const imgsList = that.image_list;
        const timePointList = that.itp_list;
        const timeLabelList = that.tl_list;
        const tmpCanvas = document.createElement("canvas");
        tmpCanvas.width = VIDEO_WIDTH;
        tmpCanvas.height = VIDEO_HEIGHT;
        const tmpCanvasCtx = tmpCanvas.getContext("2d");
        const div = that.cover_div;

        video.onloadeddata = null;

        return (event) => {
            that.initPreviewImages(imgsList, timePointList, timeLabelList);

            var i = 0;
            var time_update = function() {
                if (i < MAX_KEY_FRAME) {
                    tmpCanvasCtx.drawImage(video,0,0, VIDEO_WIDTH, VIDEO_HEIGHT);
                    imgsList[i].setAttribute('src', tmpCanvas.toDataURL());
                    video.currentTime = timePointList[i];
                    i++;
                } else {
                    video.currentTime = 0;
                    video.ontimeupdate = null;
                    video.onloadeddata = null;
                    div.style.display = "none";
                    that.updated = true;

                    initPlayer();

                }
            }

            video.ontimeupdate = time_update;
            time_update();
        }
    }

    refreshBackground(ctx) {
        ctx = ctx || this.ctx;

        ctx.fillStyle = "#FFF"
        ctx.fillRect(0, 0, VIDEO_WIDTH + TIME_LABEL_WIDTH, 12);
        ctx.fillStyle = "#000"
        ctx.fillRect(0, 12, VIDEO_WIDTH + TIME_LABEL_WIDTH, THUMB_HEIGHT + TIME_LABEL_HEIGHT);
        ctx.font = "12px";
        ctx.fillStyle = "#CCC"
    }

    fillTimeLabel(index, ctx) {
        ctx = ctx || this.ctx;
        const timeLabelList = this.tl_list;

        let leftOffset = index * 160 + 2;
        ctx.fillText(timeLabelList[index], leftOffset, 20 + 3);
    }

    fillAllTimeLabel(ctx) {
        ctx = ctx || this.ctx;
        const timeLabelList = this.tl_list;
        const that = this;

        timeLabelList.forEach(function(el, index) {
            that.fillTimeLabel(index, ctx);
        })

    }

    fillPreviewImage(index, ctx) {
        ctx = ctx || this.ctx;
        const imageList = this.image_list;

        ctx.drawImage(imageList[index],
            0, 0, VIDEO_WIDTH * CLIP_RATIO, VIDEO_HEIGHT,   //source
            index * THUMB_SMALL_WIDTH, TIME_LABEL_HEIGHT, THUMB_SMALL_WIDTH, THUMB_HEIGHT); //dest
    }

    fillAllPreviewImages(imageList, ctx) {
        ctx = ctx || this.ctx;
        imageList = imageList || this.image_list;

        imageList.forEach((item,index) => {
            this.fillPreviewImage(index);
        });
    }

    setFloatPreviewPosition() {
        const event = this.mousemoveEvent;
        const div = this.float_preview_div;
        const imageList = this.image_list;

        if (!event)
            return ;

        let index = Math.floor(event.layerX / 40);

        if (index >= MAX_KEY_FRAME)
            return ;

        div.style.top = (event.pageY - event.layerY - 90) + "px";
        div.style.left = (event.pageX - 80)+ "px";
        div.getElementsByTagName("img")[0].setAttribute("src", imageList[index].src);

    }

    drawFloatLine(ctx, justLine, otherEvent) {
        ctx = ctx || this.ctx;
        justLine = !!justLine;

        const event = otherEvent || this.mousemoveEvent;

        if (event && event.layerX > VIDEO_WIDTH)
            return;

        if (this.leaved)
            return;

        ctx.beginPath();

        ctx.strokeStyle = "#F00";
        ctx.lineWidth = 2;
        ctx.moveTo(event.layerX, 0);

        if (!justLine) {
            ctx.lineTo(event.layerX + 3, 0);
            ctx.lineTo(event.layerX, 3);
            ctx.lineTo(event.layerX - 3, 0);
            ctx.lineTo(event.layerX, 0);
        }

        ctx.lineTo(event.layerX, ctx.canvas.height);
        ctx.stroke();

        if (!justLine) {
            ctx.fillStyle = "#000"
            ctx.fillText(timeFormat(this.video.duration * (event.layerX / VIDEO_WIDTH)), event.layerX + 5, 10);
        }

    }

    drawTimeLine(ctx, video) {
        ctx = ctx || this.ctx;
        video = video || this.video;

        ctx.beginPath();
        ctx.strokeStyle = "#0F0";
        ctx.lineWidth = 2;
        ctx.rect(video.currentTime / video.duration * VIDEO_WIDTH - 1, TIME_LABEL_HEIGHT, 2, THUMB_HEIGHT);
        ctx.stroke();
    }

}
