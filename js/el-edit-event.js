
// paint pad object
let jm = null;

// resize element object
let resizeRect = null;

// resize element object cursor string
let resizeCursor = "";

//
let arrow = null;

let label = null;
let labelRect = null;

let updateEl = null;

// edit mode status
let editModeStatus = "";
let editModeType = "";

//call back for exit edit mode
let exit_callback = null;

// repaint loop flag
let repaintLoopFlag = false;

// video
let v = null;

// offset for 100ms 0.1s
let offset100ms = 10;

const setJmObject = function (g, video, ec) {
    jm = g;
    exit_callback = ec;
    v = video;

    let ctx = jm.canvas.getContext("2d");

    jm.style = {
        fillStyle : () => {
            ctx.drawImage(v, 0, 0, jm.canvas.width, jm.canvas.height);
        }
    }

    var style = {
        stroke: 'red', //TODO: just rect use red
        lineWidth: 3, //边线宽
        //小方块样式
        rectStyle: {
            stroke: 'green', //小方块边颜色
            fill: 'transparent',//小方块填充色
            lineWidth: 1, //小方块线宽
            close: true
        }
    };


    //创建一个resize,
    resizeRect = jm.createShape("resize", {
        style: style,
        position: {x:0, y:0},
        width: 0,
        height: 0,
        visible: false
    });

    resizeRect.visible = false;

    resizeRect.on('inrect', function(r) {
        resizeCursor = r.cursor;
    });
    resizeRect.on('outrect', function() {
        resizeCursor = "";
    });

    arrow = jm.createShape("arrawline", { //arrawline --> spell error
        style: {stroke: "red", lineWidth: 5},
        start: {x:0, y:0},
        end: {x:0, y:0},
    });

    arrow.arraw.offsetX = 9;
    arrow.arraw.offsetY = 40;

    arrow.start_pos = null;
    arrow.end_pos = null;

    arrow.visible = false;


    label = jm.createShape("label", {});
    labelRect = jm.createShape("rect", {close:true});

    label.visible = false;
    labelRect.visible = false;

    jm.children.add(resizeRect);
    jm.children.add(arrow);
    jm.children.add(label);
    jm.children.add(labelRect);

}

const setOffset100ms = (duration) => {
    offset100ms = Math.floor((0.1 / duration) * VIDEO_WIDTH);
}

const initEditMode = (type) => {
    if (type === "rect" ||
        type === "arrow") {

        jm.bind("mousemove", jm_mousemove);
        jm.bind("mouseup", jm_mouseup);
        jm.bind("mousedown", jm_mousedown);


    }

    if (type === "label") {
        label.style = {
            stroke:"#c00",
            fill: "#c00",
            font: "36px Arial",
            fontFamily: "Arial",
            fontSize: 36,
            textAlign: "center",
            textBaseline: "bottom"
        };

        label.text = "Demo Text";
        label.center = {x: jm.width / 2, y: jm.height - 36 * 2};

        label.initPoints();

        label.visible = true;

        resetRectByLabel(labelRect, label);

        labelRect.style = {stroke: "#FFF", lineWidth: 2, close:true};

        labelRect.initPoints();

        labelRect.visible = true;

        jm.bind("mousedown", jm_mousedown_label);
        jm.bind("mousemove", jm_mousemove_label);
        jm.bind("mouseup", jm_mouseup_label);

    }


    repaintLoopFlag = true;

    arrow.visible = false;
    resizeRect.visible = false;

    editModeStatus = "add";
    editModeType = type;

    elementPaintLoop();

}

const updateEditMode = (el) => {

    let type = el.type;
    let o = el.object;

    updateEl = el;

    if (type === "rect") {

        jm.bind("mousemove", jm_mousemove);
        jm.bind("mouseup", jm_mouseup);
        jm.bind("mousedown", jm_mousedown);

        resizeRect.position.x = o.position.x;
        resizeRect.position.y = o.position.y;

        resizeRect.width = o.width;
        resizeRect.height = o.height;

        resizeRect.reset();

        resizeRect.visible = true;
    }

    if (type === "arrow") {

        jm.bind("mousemove", jm_mousemove);
        jm.bind("mouseup", jm_mouseup);
        jm.bind("mousedown", jm_mousedown);

        arrow.start.x = o.start.x;
        arrow.start.y = o.start.y;

        arrow.end.x = o.end.x;
        arrow.end.y = o.end.y;

        arrow.initPoints();

        arrow.visible = true;
    }

    if (type === "label") {

        jm.bind("mousedown", jm_mousedown_label);
        jm.bind("mousemove", jm_mousemove_label);
        jm.bind("mouseup", jm_mouseup_label);

        label.text = o.text;
        label.center = Object.assign({}, o.center);
        label.style = Object.assign({}, o.style);

        label.initPoints();

        label.visible = true;
        labelRect.visible = true;

        resetRectByLabel(labelRect, label);
    }

    editModeStatus = "update"
    editModeType = el.type;


    repaintLoopFlag = true;

    elementPaintLoop();

}

const resetRectByLabel = (r, l) => {
    l.width = 0;
    l.testSize();

    let label_position = l.getLocation();

    r.position = {
        x: label_position.left - 4,
        y: label_position.top - 60 + 16
    };

    r.width = label_position.width + 12;
    r.height = label_position.height + 36;

    r.initPoints();
}

const drawElement = (el) => {
    let canvas = el.jm.canvas;
    let ctx = canvas.getContext('2d');

    ctx.beginPath();
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, VIDEO_WIDTH, 20);
    ctx.fillStyle = "#FFF";
    ctx.fillRect(1, 1, VIDEO_WIDTH - 2 , 20 - 2);

    ctx.fillStyle = "#8F8";
    ctx.fillRect(el.left + 1, 1, (el.right - el.left), 20 - 2);

    ctx.font = "16px Arial";
    ctx.fillStyle = "#000";
    ctx.textBaseline = "bottom";
    ctx.fillText(el.type, el.left + 3, 20, (el.right - el.left));

    ctx.stroke();

    return ctx;
}

const buildArrowObject = () => {
    let o = jm.createShape("arrawline", {
        style: {stroke: 'red', lineWidth: 5},
        start: {x: arrow.start.x, y: arrow.start.y},
        end: {x: arrow.end.x, y: arrow.end.y},
    });

    o.style.lineWidth = 5;
    o.arraw.offsetX = 9;
    o.arraw.offsetY = 40;

    return o;
}

const buildRectObject = () => {
    return jm.createShape("rect", {
        style: {stroke: 'red', lineWidth: 3},
        position: {x: resizeRect.position.x, y: resizeRect.position.y},
        width: resizeRect.width,
        height: resizeRect.height
    });
}

const buildLabelObject = () => {
    return jm.createShape("label", {
        style: Object.assign({}, label.style),
        center: Object.assign({}, label.center),
        text: label.text
    });
}

const buttonConfirmClick = () => {

    unbindJmEvent();
    resizeRect.visible = false;
    arrow.visible = false;
    label.visible = false;
    labelRect.visible = false;

    repaintLoopFlag = false;
    exit_callback(editModeStatus, editModeType, updateEl);

    return true;
}

const buttonCancelClick = () => {
    // unbind event
    unbindJmEvent();
    resizeRect.visible = false;
    arrow.visible = false;
    label.visible = false;
    labelRect.visible = false;
    repaintLoopFlag = false;
    exit_callback("");
}


const jm_mousedown_label = (e) => {
    if (jm.cursor === "move") {
        label.move_pos = Object.assign({}, e.position)
    }

}

const jm_mousemove_label = (e) => {

    if (   (e.position.x > labelRect.position.x && e.position.x < labelRect.position.x + labelRect.width)
        && (e.position.y > labelRect.position.y && e.position.y < labelRect.position.y + labelRect.height)){
        jm.cursor = "move";
    } else {
        jm.cursor = "default";
    }

    if (label.move_pos) {
        label.center.x += e.position.x - label.move_pos.x;
        label.center.y += e.position.y - label.move_pos.y;

        label.move_pos = Object.assign({}, e.position);

        label.initPoints();

        resetRectByLabel(labelRect,label);
    }
}

const jm_mouseup_label = () => {
    label.move_pos = null;
}

const jm_mousedown = (e) => {
    //set start position

    if (editModeType === "rect") {
        if (resizeRect.visible)
            return;

        resizeRect.position.x = e.position.x;
        resizeRect.position.y = e.position.y;

        resizeRect.startposition = {x:e.position.x, y: e.position.y};

        resizeRect.visible = true;
    }

    if (editModeType === "arrow") {
        if (arrow.visible)
            return;

        arrow.move_position = {x: e.position.x, y: e.position.y};

        arrow.start.x = e.position.x;
        arrow.start.y = e.position.y;

        arrow.end.x = e.position.x;
        arrow.end.y = e.position.y;

        arrow.initPoints();

        arrow.visible = true;
    }

}

const jm_mousedown_start_move = (e) => {

    //set start position
    if (editModeType === "rect") {
        if (!resizeRect.visible)
            return;
        if (   (e.position.x > resizeRect.position.x && e.position.x < resizeRect.position.x + resizeRect.width)
            && (e.position.y > resizeRect.position.y && e.position.y < resizeRect.position.y + resizeRect.height)) {

            resizeRect.old_position = {x: e.position.x, y: e.position.y};
        }
    }

    if (editModeType === "arrow") {
        if (arrow.move_status === "move_start") {

            arrow.start_pos = {x: e.position.x, y: e.position.y};

            arrow.end_pos = null;
            arrow.move_position = null;

        }

        if (arrow.move_status === "move_end") {
            arrow.end_pos = {x: e.position.x, y: e.position.y};

            arrow.start_pos = null;
            arrow.move_position = null;
        }
    }

}

const jm_mousemove = (e) => {
    let event = e.event;
    //update position
    if (event.buttons === 0)
        return ;

    if (editModeType === "rect") {

        if (!resizeRect.startposition)
            return;

        let new_x = e.position.x < resizeRect.startposition.x ? e.position.x : resizeRect.startposition.x;
        let new_y = e.position.y < resizeRect.startposition.y ? e.position.y : resizeRect.startposition.y;
        let new_w = Math.abs(e.position.x - resizeRect.startposition.x);
        let new_h = Math.abs(e.position.y - resizeRect.startposition.y);

        resizeRect.position.x = new_x;
        resizeRect.position.y = new_y;
        resizeRect.width = new_w;
        resizeRect.height = new_h;

        resizeRect.reset();
    }

    if (editModeType === "arrow") {
        if (!arrow.move_position)
            return;

        arrow.end.x = e.position.x;
        arrow.end.y = e.position.y;

        arrow.initPoints();
    }

}

const jm_mousemove_move_el = (e) => {

    //check mouse position for cursor
    if (editModeType === "rect") {
        if (   (e.position.x > resizeRect.position.x && e.position.x < resizeRect.position.x + resizeRect.width)
            && (e.position.y > resizeRect.position.y && e.position.y < resizeRect.position.y + resizeRect.height)){
            jm.canvas.style.cursor = "move";
        } else {
            jm.canvas.style.cursor = "default";
        }

        if (resizeCursor)
            jm.canvas.style.cursor = resizeCursor;

        if (resizeRect.old_position) {
            resizeRect.position.x += e.position.x - resizeRect.old_position.x;
            resizeRect.position.y += e.position.y - resizeRect.old_position.y;

            resizeRect.old_position = {x: e.position.x, y: e.position.y};

            resizeRect.reset();
        }
    }

    if (editModeType === "arrow") {
        //check start or end
        if (Math.abs(e.position.x - arrow.start.x) <= 5 && Math.abs(e.position.y - arrow.start.y) <= 5) {
            arrow.move_status = "move_start";
            jm.cursor = "pointer";
        } else if (Math.abs(e.position.x - arrow.end.x) <= 5 && Math.abs(e.position.y - arrow.end.y) <= 5) {
            arrow.move_status = "move_end";
            jm.cursor = "pointer"
        } else {
            if (arrow.move_status && jm.cursor === "pointer")
                jm.cursor = "default"
            arrow.move_status = "";
        }

        if (arrow.move_position) {
            arrow.start.x += e.position.x - arrow.move_position.x;
            arrow.start.y += e.position.y - arrow.move_position.y;
            arrow.end.x += e.position.x - arrow.move_position.x;
            arrow.end.y += e.position.y - arrow.move_position.y;

            arrow.move_position.x = e.position.x;
            arrow.move_position.y = e.position.y;

            arrow.initPoints();
        }

        if (arrow.start_pos) {
            arrow.start.x += e.position.x - arrow.start_pos.x;
            arrow.start.y += e.position.y - arrow.start_pos.y;

            arrow.start_pos.x = e.position.x;
            arrow.start_pos.y = e.position.y;

            arrow.initPoints();
        }

        if (arrow.end_pos) {
            arrow.end.x += e.position.x - arrow.end_pos.x;
            arrow.end.y += e.position.y - arrow.end_pos.y;

            arrow.end_pos.x = e.position.x;
            arrow.end_pos.y = e.position.y;

            arrow.initPoints();
        }
    }

}

const jm_mouseup = () => {
    resizeRect.startposition = null;
    arrow.move_position = null;

    // release event
    unbindJmEvent();

    jm.bind("mousedown", jm_mousedown_start_move);
    jm.bind("mousemove", jm_mousemove_move_el);
    jm.bind("mouseup", jm_mouseup_end_move);

    if (editModeType === "arrow") {
        const arrow_mouse_down = (e) => {
            if (!arrow.move_status)
                arrow.move_position = {
                    x: e.position.x,
                    y: e.position.y
                }
        }

        const arrow_mouse_move = () => {
            if (!arrow.move_status)
                jm.cursor = "move";
        }

        const arrow_mouse_leave = () => {
            jm.cursor = "default";
        }

        const arrow_mouse_up = () => {
            arrow.move_position = null;
            arrow.start_pos = null;
            arrow.end_pos = null;
        }

        arrow.cursor = "move";

        arrow.bind("mousedown", arrow_mouse_down);
        arrow.bind("mousemove", arrow_mouse_move);
        arrow.bind("mouseleave", arrow_mouse_leave);
        arrow.bind("mouseup", arrow_mouse_up);

        arrow.unbind_event = () => {
            arrow.unbind("mousedown", arrow_mouse_down);
            arrow.unbind("mousemove", arrow_mouse_move);
            arrow.unbind("mouseleave", arrow_mouse_leave);
            arrow.unbind("mouseup", arrow_mouse_up);
        }
    }
}

const jm_mouseup_end_move = () => {
    resizeRect.old_position = "";

    if (editModeType === "arrow") {
        arrow.move_position = null;
        arrow.start_pos = null;
        arrow.end_pos = null;
    }
}

const buildShapeObject = (type) => {
    if (type === "rect")
        return buildRectObject();

    if (type === "arrow")
        return buildArrowObject();

    if (type === "label")
        return buildLabelObject();

}

const labelTextChange = (e) => {
    label.text = e.target.value;
    label.width = 0;


    label.initPoints();

    resetRectByLabel(labelRect, label);
}

const unbindJmEvent = () => {
    jm.unbind("mousemove", jm_mousemove);
    jm.unbind("mouseup", jm_mouseup);
    jm.unbind("mousedown", jm_mousedown);

    jm.unbind("mousedown", jm_mousedown_start_move);
    jm.unbind("mousemove", jm_mousemove_move_el);
    jm.unbind("mouseup", jm_mouseup_end_move);

    jm.unbind("mousedown", jm_mousedown_label);
    jm.unbind("mousemove", jm_mousemove_label);
    jm.unbind("mouseup", jm_mouseup_label);
}

const el_mousedown = (e) => {

    let target = e.target;
    let el = target.el;

    el.buttondown = true;

    if (el.state === "move") {
        el.move_start = e.layerX;
    }

}

const el_mousemove = (e) => {

    let target = e.target;
    let el = target.el;

    let left = el.left;
    let right = el.right;

    if (!el.buttondown && e.buttons === 0) {
        if (Math.abs(e.layerX - left) <= 2) {
            el.state = "left";
            target.style.cursor = "ew-resize";
        } else if (Math.abs(e.layerX - right) <= 2) {
            el.state = "right";
            target.style.cursor = "ew-resize";
        } else if (e.layerX > left + 2 && e.layerX < right - 2) {
            el.state = "move";
            target.style.cursor = "move";
        } else {
            el.state = "";
            target.style.cursor = "default";
        }
    } else
        switch (el.state) {
            case "left": {
                if (e.layerX <= 0)
                    el.left = 0;
                else if (e.layerX > el.right - offset100ms)
                    el.left = el.right - offset100ms;
                else
                    el.left = e.layerX;

                el.start_time = (el.left / VIDEO_WIDTH) * video.duration;

                break;
            }

            case "right": {
                if (el.right >= VIDEO_WIDTH)
                    el.right = VIDEO_WIDTH;
                else if (el.right < el.left + offset100ms)
                    el.right = el.left + offset100ms;
                else
                    el.right = e.layerX;

                el.end_time = (el.right / VIDEO_WIDTH) * video.duration;

                break;
            }

            case "move": {
                if (!el.move_start)
                    break;

                let offset = e.layerX - el.move_start;

                if (el.left + offset <= 0){
                    offset = 0 - el.left;
                }


                if (el.right + offset >= VIDEO_WIDTH) {
                    offset = VIDEO_WIDTH - el.right;
                }


                el.left += offset;
                el.right += offset;

                el.start_time = (el.left / VIDEO_WIDTH) * video.duration;
                el.end_time = (el.right / VIDEO_WIDTH) * video.duration;

                el.move_start = e.layerX;


                break;
            }

            default: {

            }
        }
};

const el_mouseup = (e) => {
    let target = e.target;
    let el = target.el;

    el.buttondown = false;

};


const elementPaintLoop = () => {
    // set a start/stop flag
    if (jm.needUpdate) {
        jm.redraw();
    }


    setTimeout(() => {
        if (repaintLoopFlag)
            elementPaintLoop();
    }, 50)

};
