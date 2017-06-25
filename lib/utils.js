/**
 * Similar to jQuery serializeArray function except this will provide a key-value mapping of a form.
 * If the form has multiple inputs with the same name, only the last value will be provided.
 */
function serializeObject(form){
    var arr = form.serializeArray();
    var obj = {};

    arr.forEach(function(input){
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
    if (discriminant<0){
        return roots;
    }

    //single root
    if (discriminant===0){
        roots.push((-b)/(2*a));
        return roots;
    }

    //two roots
    else{
        roots.push((-b + Math.sqrt(discriminant)) / (2 * a));
        roots.push((-b - Math.sqrt(discriminant)) / (2 * a));
        return roots;
    }
}

function create2DArray(rows) {
    var arr = [];

    for (var i = 0; i < rows; i++) {
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

function noop(){

}

/**
 * Sets the height and width of the given canvas.
 * @param {HTMLCanvasElement} canvas
 * @param {number} width
 * @param {number} height
 */
function setCanvasSize(canvas, width, height){
    canvas = $(canvas);
    canvas.attr({'width': width, 'height': height});
}

/**
 * Sets the left and top properties of the given canvas.
 * @param {HTMLCanvasElement} canvas
 * @param {number} left
 * @param {number} top
 */
function setCanvasPosition(canvas, left, top){
    canvas = $(canvas);
    canvas.css('top', '' + top + 'px');
    canvas.css('left', '' + left + 'px');
}

/**
 * Creates a function that generates full static urls from base static urls.
 * For example, if urlRoot was '/static', then the returned function would attach '/static' to all
 * static urls. Providing the returned function a value of 'css/bundle.css', would generate '/static/css/bundle.css'.
 * @param {string} urlRoot - The root URL to be attached to the front of all static links. i.e. /static or static.example.com/
 * @param {object} [manifest] - An object mapping from base static urls to other base static urls. For example, this can be used to map static filenames to their hashed static filenames.
 * @returns {Function}
 */
function staticLinks(urlRoot, manifest){

    var useManifest = manifest? true: false;

    //add trailing slash
    urlRoot = urlRoot.charAt(urlRoot.length-1) === '/'? urlRoot: urlRoot +'/';

    return function(url){

        if (useManifest){
            url = manifest[url];
        }
        if (url.charAt(0) == '/')
            return urlRoot + url.slice(1);
        else
            return urlRoot + url;
    }
}

module.exports = {
    serializeObject:serializeObject,
    solveQuadraticEquation:solveQuadraticEquation,
    create2DArray:create2DArray,
    randomInt:randomInt,
    noop:noop,
    setCanvasSize:setCanvasSize,
    setCanvasPosition:setCanvasPosition,
    staticLinks:staticLinks
};