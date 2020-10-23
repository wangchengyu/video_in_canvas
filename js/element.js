// this file use for define element object

/* ------------------------------------------------
 * type define
 *
 *
 * ------------------------------------------------ */

// size object
// sample:
// s = new ElementSize(1,2)
const ElementSize = (w, h) => {
    return {w, h};
};

// position object
const ElementPosition = (x, y) => {
    return {x, y};
}

// action default value is "show"
const ElementAction = (start_time, end_time, action = "show", element = null) => {
    return {start_time, end_time, action, element};
}

// TODO: element might have some actions, but only one just in DEMO
const ElementActions = (action) => {
    return [action];
}

// jm shape just support arc, label, rect
const getPositionInfo = (jm_shape) => {


}

// Base Element Object
const ElementBase = (type, size, position, color, actions) => {
    return {type, size, position, color, actions};
}

// Image Element
const ElementImg = (img_url, size, position, color, actions) => {

    let element = new ElementBase('img', size, position, color, actions);

    element['img_url'] = img_url;
    element['html'] = "<img src='" + img_url + "' style='display:none;'>";

    return element;
};

const ElementSharp = (shape_type, size, position, color, actions, object = null) => {

    let element = new ElementBase(shape_type, size, position, color, actions);

    // this function is build for object function
    const from_shape = (jm_sharp) => {
        function get_sharpen_position_x(jm_sharp) {
            if (jm_sharp.type === 'jmArc') { //arc
                return Math.floor((jm_sharp.center.x - jm_sharp.width / 2));
            }

            if (jm_sharp.type === 'jmRect') {
                return Math.floor((jm_sharp.position.x))
            }

            if (jm_sharp.type === 'jmLabel') {
                return Math.floor((jm_sharp.position.x))
            }
        }
        function get_sharpen_position_y(jm_sharp) {

            if (jm_sharp.type === 'jmArc') { //arc
                return Math.floor((jm_sharp.center.y - jm_sharp.height / 2));
            }

            if (jm_sharp.type === 'jmRect') {
                return Math.floor((jm_sharp.position.y))
            }

            if (jm_sharp.type === 'jmLabel') {
                return Math.floor((jm_sharp.position.y))
            }
        }

        var size = new ElementSize(jm_sharp.width, jm_sharp.height);
        var position = new ElementPosition(get_sharpen_position_x(jm_sharp), get_sharpen_position_y(jm_sharp));
    }

    element.object = object;
    element.from_shape = from_shape;
    element.base_style = {
        stroke: '#F00', //TODO: color
        //lineType: 'dotted',
        lineWidth: 2
    }

    return element;

    // TODO:  ........ refact

    if (object === null) {
        // create jm sharp object
        if (shape_type === "circle")
            object = new jmCircle(
                {
                    center: {x: position.x + size.width / 2, y: position.y + size.height / 2},
                    width: size.width,
                    height: size.height,
                    style: style
                }
            )

    }
}

const ElementSharpRect = (size, position, color, actions, object) => {
    let element = new ElementSharp("rect", size, position, color, actions);

    if (object === null)
        object = new jmRect(
            {
                position: position,
                width: size.width,
                height: size.height,
                style: element.base_style
            }
        )

    element.object = object;

    return element;
}

const ElementSharpCircle = (size, position, color, actions, object) => {

    let element = new ElementSharp("circle", size, position, color, actions);

    if (object === null)
        object = new jmCircle(
            {
                center: {x: position.x + size.width / 2, y: position.y + size.height / 2},
                width: size.width,
                height: size.height,
                style: style
            }
        )

    element.object = object;

    return element;
}