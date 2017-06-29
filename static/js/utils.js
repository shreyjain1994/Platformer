var $ = require('jquery');

/**
 * Similar to jQuery serializeArray function except this will provide a key-value mapping of a form.
 * If the form has multiple inputs with the same name, only the last value will be provided.
 */
function serializeObject(form) {
    var arr = form.serializeArray();
    var obj = {};

    arr.forEach(function (input) {
        obj[input.name] = input.value;
    });
    return obj;
}

/**
 * Given the three parameters of the quadratic equation, returns the roots.
 * @param {number} a
 * @param {number} b
 * @param {number} c
 * @returns {Array}
 */
function solveQuadraticEquation(a, b, c) {

    var roots = [];
    var discriminant = Math.pow(b, 2) - 4 * a * c;

    //no roots
    if (discriminant < 0) {
        return roots;
    }

    //single root
    if (discriminant === 0) {
        roots.push((-b) / (2 * a));
        return roots;
    }

    //two roots
    else {
        roots.push((-b + Math.sqrt(discriminant)) / (2 * a));
        roots.push((-b - Math.sqrt(discriminant)) / (2 * a));
        return roots;
    }
}

/**
 * Creates a 2d array.
 * @param {number} columns - Number of columns in the 2D array.
 * @returns {Array []}
 */
function create2DArray(columns) {
    var arr = [];

    for (var i = 0; i < columns; i++) {
        arr[i] = [];
    }

    return arr;
}

/**
 * Generates a random number x such that min <= x <= max.
 * @param min The lower bound.
 * @param max The upper bound.
 * @returns {number} The random integer.
 */
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

/**
 * No operation function.
 */
function noop() {

}

/**
 * Sets the height and width of the given canvas.
 * @param {HTMLCanvasElement} canvas
 * @param {number} width
 * @param {number} height
 */
function setCanvasSize(canvas, width, height) {
    canvas = $(canvas);
    canvas.attr({'width': width, 'height': height});
}

/**
 * Sets the left and top properties of the given canvas.
 * @param {HTMLCanvasElement} canvas
 * @param {number} left
 * @param {number} top
 */
function setCanvasPosition(canvas, left, top) {
    canvas = $(canvas);
    canvas.css('top', '' + top + 'px');
    canvas.css('left', '' + left + 'px');
}

module.exports = {
    serializeObject: serializeObject,
    solveQuadraticEquation: solveQuadraticEquation,
    create2DArray: create2DArray,
    randomInt: randomInt,
    noop: noop,
    setCanvasSize: setCanvasSize,
    setCanvasPosition: setCanvasPosition
};