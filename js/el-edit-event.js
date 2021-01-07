
// paint pad object
var jm = null;

// resize element object
var resizeRect = null;

// resize element object cursor string
var resizeCursor = "";

// confirm flag
var confirmed = false;

//call back for exit edit mode
var exit_callback = null;

// repaint loop flag
var repaint_loop = false;

// video
var v = null;

// offset for 100ms 0.1s
var offset_100ms = 10;

const setJmObject = function (g, video, ec) {
    jm = g;
    exit_callback = ec;
    confirmed = false;
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

    resizeRect.on('move', function() {
        console.log("resize move")
    });

    resizeRect.on('inrect', function(r) {
        resizeCursor = r.cursor;
    });
    resizeRect.on('outrect', function() {
        resizeCursor = "";
    });


    jm.children.add(resizeRect);
}

const setOffset100ms = (duration) => {
    offset_100ms = Math.floor((0.1 / duration) * VIDEO_WIDTH);
}

const initEditMode = (type) => {

    jm.bind("mousemove", jm_mousemove);
    jm.bind("mouseup", jm_mouseup);
    jm.bind("mousedown", jm_mousedown);


    resizeRect.visible = false;
    repaint_loop = true;

    g_paint();

}

const jm_mousedown = (e) => {
    let event = e.event;
    //set start position

    if (resizeRect.visible)
        return;

    resizeRect.position.x = e.position.x;
    resizeRect.position.y = e.position.y;

    resizeRect.startposition = {x:e.position.x, y: e.position.y};

    resizeRect.visible = true;
}

const jm_mousedown_start_move = (e) => {
    let event = e.event;
    //set start position

    if (!resizeRect.visible)
        return;
    if (   (e.position.x > resizeRect.position.x && e.position.x < resizeRect.position.x + resizeRect.width)
        && (e.position.y > resizeRect.position.y && e.position.y < resizeRect.position.y + resizeRect.height)) {

        resizeRect.old_position = {x: e.position.x, y: e.position.y};
    }
}

const jm_mousemove = (e) => {
    let event = e.event;
    //update position
    if (event.buttons === 0)
        return ;

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

const jm_mousemove_move_rect = (e) => {
    let event = e.event;

    //check mouse position for cursor
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


const jm_mouseup = (e) => {
    resizeRect.startposition = null;
    // release event
    unbind_jm_event();

    jm.bind("mousedown", jm_mousedown_start_move);
    jm.bind("mousemove", jm_mousemove_move_rect);
    jm.bind("mouseup", jm_mouseup_end_move);
}

const jm_mouseup_end_move = (e) => {
    resizeRect.old_position = "";
}

const buildRectObject = () => {
    return jm.createShape("rect", {
        style: {stroke: 'red', lineWidth: 3},
        position: {x: resizeRect.position.x, y: resizeRect.position.y},
        width: resizeRect.width,
        height: resizeRect.height
    });
}

const jm_confirm = () => {
    unbind_jm_event();
    resizeRect.visible = false;
    repaint_loop = false;
    exit_callback(true);

    // {
    //     position : {
    //         x: resizeRect.position.x,
    //             y: resizeRect.position.y
    //     },
    //     width: resizeRect.width,
    //         height: resizeRect.height
    // }
    return true;
}

const jm_cancel = () => {
    // unbind event
    unbind_jm_event();
    resizeRect.visible = false;
    repaint_loop = false;
    exit_callback(false);
}

const unbind_jm_event = () => {
    jm.unbind("mousemove", jm_mousemove);
    jm.unbind("mouseup", jm_mouseup);
    jm.unbind("mousedown", jm_mousedown);

    jm.unbind("mousedown", jm_mousedown_start_move);
    jm.unbind("mousemove", jm_mousemove_move_rect);
    jm.unbind("mouseup", jm_mouseup_end_move);
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

    if (!el.buttondown && e.buttons == 0)

        if (e.layerX > left - 2 && e.layerX < left + 2) {
            el.state = "left";
            target.style.cursor = "ew-resize";
        } else if (e.layerX > right - 2 && e.layerX < right + 2) {
            el.state = "right";
            target.style.cursor = "ew-resize";
        } else if (e.layerX > left + 3 && e.layerX < right - 3) {
            el.state = "move";
            target.style.cursor = "move";
        } else {
            el.state = "";
            target.style.cursor = "default";
        }

    else
        switch (el.state) {
            case "left": {
                if (e.layerX <= 0)
                    el.left = 0;
                else if (e.layerX > el.right - offset_100ms)
                    el.left = el.right - offset_100ms;
                else
                    el.left = e.layerX;

                el.start_time = (el.left / VIDEO_WIDTH) * video.duration;

                break;
            }

            case "right": {
                if (el.right >= VIDEO_WIDTH)
                    el.right = VIDEO_WIDTH;
                else if (el.right < el.left + offset_100ms)
                    el.right = el.left + offset_100ms;
                else
                    el.right = e.layerX;

                el.end_time = (el.right / VIDEO_WIDTH) * video.duration;

                break;
            }

            case "move": {
                let offset = e.layerX - el.move_start;

                if (el.left + offset <= 0)
                    break;

                if (el.right + offset >= VIDEO_WIDTH)
                    break;

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

const el_visible = (e) => {

}

const el_deleted = () => {
    
}

const g_paint = () => {
    // set a start/stop flag
    if (jm.needUpdate) {
        jm.redraw();
    }


    setTimeout(() => {
        if (repaint_loop)
            g_paint();
    }, 50)

};

/*
    var action_rect = null;
    var action_arrawline = null;
    var action_label = null;
    var edit_state = false

    g.bind("mousedown", (event) => {


        if ($(".js-arrawline").prop("checked")) {

            $(".js-arrawline-editor").show();
            $(".js-hint").hide();

            //console.log(event);
            action_arrawline = g.createShape("arrawline", {
                style: {stroke:"#ccc", lineType:"dotted", lineWidth: 3, dashLength: 20},
                start: {x: event.position.x, y: event.position.y},
                end: {x: event.position.x, y: event.position.y}
            })

            action_arrawline.resizing = true;

            g.children.add(action_arrawline); //temp rect

            action_arrawline.start_time = video.currentTime - 0.001 //for show at this time point
            action_arrawline.end_time = video.currentTime + 3

            //update input
            $("input[placeholder=startx]").val(action_arrawline.start.x);
            $("input[placeholder=starty]").val(action_arrawline.start.y);

            edit_state = true;
        }

        if ($(".js-label").prop("checked") && action_label == null && !edit_state) {

            $(".js-label-editor").show();
            $(".js-hint").hide();

            //console.log(event);
            action_label = g.createShape("label", {
                style: {
                    stroke:"#ccc",
                    fill: "#ccc",
                    textAlign: 'left',
                    font: "48px Arial",
                    border: {
                        left:1,
                        top:1,
                        right:1,
                        bottom:1,
                        style: {
                            stroke: 'red'
                        }
                    },
                },
                position: {x: event.position.x, y: event.position.y},
                text: "demo text",

            })

            action_label.resizing = true;

            g.children.add(action_label); //temp rect

            action_label.start_time = video.currentTime - 0.001 //for show at this time point
            action_label.end_time = video.currentTime + 3

            //update input
            $("input[placeholder=ltop]").val(action_label.position.y);
            $("input[placeholder=lleft]").val(action_label.position.x);

            edit_state = true;
        }

        return true;
    });
    //
    g.bind("mousemove", (event) => {

        $(".js-mouse_top").val(event.position.y);
        $(".js-mouse_left").val(event.position.x);

        if (true && action_rect !== null && edit_state) {

            if (event.event.buttons === 0)
                return ;

            if (!action_rect.resizing)
                return ;

            action_rect.width = event.position.x - action_rect.position.x;
            action_rect.height = event.position.y - action_rect.position.y;

            //update input
            $("input[placeholder=width]").val(action_rect.width);
            $("input[placeholder=height]").val(action_rect.height);

            return ;
        }

        if ($(".js-arrawline").prop("checked") && action_arrawline !== null && edit_state) {

            if (event.event.buttons === 0)
                return ;

            if (!action_arrawline.resizing)
                return ;

            action_arrawline.end.x = event.position.x;
            action_arrawline.end.y = event.position.y;

            //update input
            $("input[placeholder=endx]").val(action_arrawline.end.x);
            $("input[placeholder=endy]").val(action_arrawline.end.y);

            return true;
        }

        if ($(".js-label").prop("checked") && action_label !== null && edit_state) {

            if (event.event.buttons === 0)
                return ;

            if (!action_label.resizing)
                return ;

            action_label.width = event.position.x - action_label.position.x;
            action_label.height = event.position.y - action_label.position.y;
            action_label.style.font = action_label.height - 4 + "px Arial"; // TODO: has a bug

            //update input
            $("input[placeholder=size]").val(action_label.style.fontSize);


            return true;
        }

    });

    g.bind("mouseup", (event) => {
        //debugger;
        if (true && action_rect !== null && edit_state) {

            if (action_rect.width < 2 && action_rect.height < 2) {
                exit_edit_state("rect");
            }
            action_rect.style.stroke = "#F00";
            action_rect.canMove(true);
            action_rect.bind("moveend", function() {
                $("input[placeholder=top]").val(action_rect.position.y);
                $("input[placeholder=left]").val(action_rect.position.x);
            });
            action_rect.resizing = false;

            return true;
        }

        if ($(".js-arrawline").prop("checked") && action_arrawline !== null && edit_state) {
            if (action_arrawline === null) {
                return ;
            }

            if (action_arrawline.width < 2 && action_arrawline.height < 2) {
                exit_edit_state("arrawline");
            }
            action_arrawline.style.stroke = "#F00";
            action_arrawline.canMove(true);
            action_arrawline.bind("moveend", function() {
                $("input[placeholder=starty]").val(action_arrawline.start.y);
                $("input[placeholder=startx]").val(action_arrawline.start.x);
                $("input[placeholder=endy]").val(action_arrawline.end.y);
                $("input[placeholder=endx]").val(action_arrawline.end.x);
            });

            action_arrawline.resizing = false;

            return true;
        }

        if ($(".js-label").prop("checked") && action_label !== null && edit_state) {

            if (action_label.width < 2 && action_label.height < 2) {
                exit_edit_state("label");
            }
            // action_label.style.stroke = "#F00";
            action_label.canMove(true);
            action_label.bind("moveend", function() {
                $("input[placeholder=ltop]").val(action_label.position.y);
                $("input[placeholder=lleft]").val(action_label.position.x);
            });
            action_label.resizing = false;

            return true;
        }
    });
*/
