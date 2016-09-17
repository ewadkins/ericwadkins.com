var boardSize = 64;
var cells = 256;
var board = [];

var paused;
var speed;
var random;
var randomFactor;
var gas;
var wall;
var eraser;
var brush;
var drawVectors;

function start() {
    $('#simulation').unbind();

    /*
    var board = [
        [['w'], ['w'], ['w'], ['w'], ['w'], ['w'], ['w'], ['w'], ['w'], ['w']],
        [['w'], [], [], [], [], [], [], [], [], ['w']],
        [['w'], [], [], [], [], [], [], [], [], ['w']],
        [['w'], [], ['e'], [], [], [], [], [], [], ['w']],
        [['w'], [], [], [], [], [], [], [], [], ['w']],
        [['w'], [], [], [], [], [], [], [], [], ['w']],
        [['w'], [], [], [], [], [], [], [], [], ['w']],
        [['w'], [], [], [], [], [], [], [], [], ['w']],
        [['w'], [], [], [], [], [], [], [], [], ['w']],
        [['w'], ['w'], ['w'], ['w'], ['w'], ['w'], ['w'], ['w'], ['w'], ['w']],
    ];
    */

    var directions = ['l', 'u', 'r', 'd'];
    
    reset();

    var c;
    var ctx;
    var scale;
    var height;
    var width;
    var cellSize;
    var canvasSize;
    var lastX;
    var lastY;
    $(function() {
        c = document.getElementById('simulation');
        ctx = c.getContext('2d');

        initialize();
        update();

        var count = 0;
        setInterval(function() {
            if (!paused) {
                for (var i = 0; i < speed; i++) {
                    step();
                }
            }
        }, 15);
        setInterval(function() {
            //if (count % speed === 0) {
                update();
            //}
            //count++;
        }, 30);

        var intervals = [];
        $('#simulation').click(function(e) {
            var elm = $(this);
            lastX = e.pageX - elm.offset().left;
            lastY = e.pageY - elm.offset().top;
            useTool();
        }).mousedown(function(e) {
            console.log('STARTING');
            var elm = $(this);
            lastX = e.pageX - elm.offset().left;
            lastY = e.pageY - elm.offset().top;
            intervals.push(setInterval(function() {
                useTool();
            }, 15));
        }).mousemove(function(e) {
            console.log('Moving mouse');
            var elm = $(this);
            lastX = e.pageX - elm.offset().left;
            lastY = e.pageY - elm.offset().top;
        }).mouseup(function() {
            while (intervals.length) {
                clearInterval(intervals.pop());
            }
        });

        $(window).resize(function() {
            //$('#simulation').width('100%');
            //$('#simulation').width('100%');
            initialize();
            update();
        });
        $(window).resize();
    });
    
    function useTool() {
        //console.log('test');
        var x = lastX;
        var y = lastY;
        var xIndex = parseInt(x / cellSize * scale);
        var yIndex = parseInt(y / cellSize * scale);
        var margin = scale * (brush);
        if (yIndex >= 0 && yIndex < height && xIndex >= 0 && xIndex < width) {
            for (var i = yIndex - margin; i < yIndex + margin; i++) {
                for (var j = xIndex - margin; j < xIndex + margin; j++) {
                    if (i >= 0 && i < height && j >= 0 && j < width && Math.pow(i - yIndex, 2) + Math.pow(j - xIndex, 2) < margin * margin) {
                        if (gas) {
                            for (var k = 0; k < directions.length; k++) {
                                board[i][j].push(directions[k]);
                            }
                        }
                        else if (wall) {
                            board[i][j] = ['w'];
                        }
                        else if (eraser) {
                            board[i][j] = [];
                        }

                        var set = {};
                        for (var k = 0; k < board[i][j].length; k++) {
                            set[board[i][j][k]] = true;
                        }
                        board[i][j] = [];
                        if (set['w']) {
                            board[i][j].push('w');
                        }
                        for (var k = 0; k < directions.length; k++) {
                            if (set[directions[k]]) {
                                board[i][j].push(directions[k]);
                            }
                        }
                    }
                }
            }
        }
    }

    function initialize() {
        canvasSize = Math.min($('#simulation').width(), $('#simulation').height());
        //$('#simulation').width(canvasSize);
        //$('#simulation').width(canvasSize);
        c.width = canvasSize;
        c.height = canvasSize;

        height = board.length;
        width = (board[0] || []).length;
        if (!width || !height || width % boardSize || height % boardSize || width !== height) {
            return alert('Invalid board');
        }

        scale = parseInt(width / boardSize);
        cellSize = canvasSize / boardSize;
    }

    function step() {
        var opposites = {
            'l': 'r',
            'u': 'd',
            'r': 'l',
            'd': 'u'
        };
        var rotations1 = {
            'l': 'u',
            'u': 'r',
            'r': 'd',
            'd': 'l'
        };
        var rotations2 = {
            'l': 'd',
            'u': 'l',
            'r': 'u',
            'd': 'r'
        };

        for (var i = 0; i < height; i++) {
            for (var j = 0; j < width; j++) {
                var wall = false;
                for (var k = 0; k < board[i][j].length; k++) {
                    if (board[i][j][k] === 'w') {
                        wall = true;
                        break;
                    }
                }
                if (wall) {
                    for (var k = 0; k < board[i][j].length; k++) {
                        if (board[i][j][k] !== 'w') {
                            board[i][j][k] = opposites[board[i][j][k]];
                        }
                    }
                }
            }
        }

        for (var i = 0; i < height; i++) {
            for (var j = 0; j < width; j++) {
                if (board[i][j].length == 2) {
                    var left = false;
                    var up = false;
                    var right = false;
                    var down = false;
                    for (var k = 0; k < board[i][j].length; k++) {
                        if (board[i][j][k] === 'l') left = true;
                        else if (board[i][j][k] === 'u') up = true;
                        else if (board[i][j][k] === 'r') right = true;
                        else if (board[i][j][k] === 'd') down = true;
                    }
                    if (left && right) {
                        board[i][j] = ['u', 'd'];
                    }
                    else if (up && down) {
                        board[i][j] = ['l', 'r'];
                    }
                }
            }
        }

        for (var i = 0; i < height; i++) {
            for (var j = 0; j < width; j++) {
                for (var k = 0; k < board[i][j].length; k++) {
                    if (board[i][j][k] === 'u' || board[i][j][k] === 'l') {
                        var p = board[i][j][k];
                        board[i][j].splice(k, 1);
                        k--;
                        if (p === 'u' && i > 0) {
                            board[i - 1][j].push(p);
                        }
                        if (p === 'l' && j > 0) {
                            board[i][j - 1].push(p);
                        }
                    }
                }
            }
        }

        for (var i = height - 1; i >= 0; i--) {
            for (var j = width - 1; j >= 0; j--) {
                for (var k = 0; k < board[i][j].length; k++) {
                    if (board[i][j][k] === 'd' || board[i][j][k] === 'r') {
                        var p = board[i][j][k];
                        board[i][j].splice(k, 1);
                        k--;
                        if (p === 'd' && i < height - 1) {
                            board[i + 1][j].push(p);
                        }
                        if (p === 'r' && j < width - 1) {
                            board[i][j + 1].push(p);
                        }
                    }
                }
            }
        }

        if (random) {
            for (var i = 0; i < height; i++) {
                for (var j = 0; j < width; j++) {
                    var wall = false;
                    for (var k = 0; k < board[i][j].length; k++) {
                        if (board[i][j][k] === 'w') {
                            wall = true;
                        }
                    }
                    if (!wall) {
                        for (var k = 0; k < board[i][j].length; k++) {
                            if (Math.random() < randomFactor * (0 || board[i][j][k].length)) {
                                var rotated = Math.random() < 0.5 ? rotations1[board[i][j][k]] : rotations2[board[i][j][k]];
                                var allowed = true;
                                for (var l = 0; l < board[i][j].length; l++) {
                                    if (board[i][j][l] === rotated) {
                                        allowed = false;
                                        break;
                                    }
                                }
                                if (allowed) {
                                    board[i][j][k] = rotated;
                                }
                            }
                        }
                    }
                }
            }
        }

    }

    function update() {
        // Create empty matrices
        var matrix = [];
        var vectors = [];
        for (var i = 0; i < boardSize; i++) {
            matrix.push([]);
            vectors.push([]);
            for (var j = 0; j < boardSize; j++) {
                matrix[i].push(0);
                vectors[i].push([0, 0]);
            }
        }

        for (var i = 0; i < height; i++) {
            for (var j = 0; j < width; j++) {
                var ii = parseInt(i / scale);
                var jj = parseInt(j / scale);
                if (matrix[ii][jj] === -1) {
                    continue;
                }
                for (var k = 0; k < board[i][j].length; k++) {
                    if (board[i][j][k] === 'w') {
                        matrix[ii][jj] = -1;
                        vectors[ii][jj] = [0, 0];
                        break;
                    }
                    else {
                        matrix[ii][jj] += 1;
                        if (board[i][j][k] === 'l') {
                            vectors[ii][jj][0] -= 1;
                        }
                        else if (board[i][j][k] === 'u') {
                            vectors[ii][jj][1] -= 1;
                        }
                        else if (board[i][j][k] === 'r') {
                            vectors[ii][jj][0] += 1;
                        }
                        else if (board[i][j][k] === 'd') {
                            vectors[ii][jj][1] += 1;
                        }
                    }
                }
            }
        }

        // Clears the canvas
        ctx.canvas.width = ctx.canvas.width;

        var normalization = Math.sqrt(scale * scale * directions.length);
        for (var i = 0; i < boardSize; i++) {
            for (var j = 0; j < boardSize; j++) {
                if (matrix[i][j] === -1) {
                    ctx.fillStyle = 'black';
                }
                else {
                    var color = parseInt(255 * (1 - matrix[i][j] / (scale * scale * directions.length)));
                    ctx.fillStyle = rgbToHex(255, color, color);
                    
                    if (i % 2 == 0 && j % 2 == 0) {
                        if ((vectors[i][j][0] || vectors[i][j][1]) && drawVectors) {
                            ctx.moveTo(cellSize * (j + 0.5), cellSize * (i + 0.5));
                            ctx.lineTo(cellSize * (j + 0.5 + vectors[i][j][0] / normalization),
                                       cellSize * (i + 0.5 + vectors[i][j][1] / normalization));
                            ctx.stroke();
                        }
                    }
                }
                ctx.fillRect(cellSize * j, cellSize * i, cellSize, cellSize);
            }
        }
    }
    

    function reset() {
        board = [];
        for (var i = 0; i < cells; i++) {
            board.push([]);
            for (var j = 0; j < cells; j++) {
                board[i].push([]);
            }
        }
        // Create edge walls
        var margin = board[0].length / boardSize;
        for (var i = 0; i < cells; i++) {
            for (var j = 0; j < margin; j++) {
                board[i][j] = ['w'];
                board[j][i] = ['w'];
                board[i][cells - 1 - j] = ['w'];
                board[cells - 1 - j][i] = ['w'];
            }
        }

        // Adds atmosphere
        var modifier = 0.00;
        for (var i = margin; i < cells - margin; i++) {
            for (var j = margin; j < cells - margin; j++) {
                if (Math.random() < modifier) {
                    shuffle(directions);
                    var r = parseInt(Math.random() * (directions.length + 1));
                    for (var k = 0; k < r; k++) {
                        board[i][j].push(directions[k]);
                    }
                }
            }
        }

        // Fill top left corner
        /*for (var i = margin; i < cells - margin; i++) {
            for (var j = margin; j < cells - margin; j++) {
                shuffle(directions);
                var r = parseInt(Math.random() * (cells * cells + 1));
                if (r < i * j) {
                    var r2 = parseInt(Math.random() * (directions.length + 1));
                    for (var k = 0; k < r2; k++) {
                            board[i][j].push(directions[k]);
                    }
                }
            }
        }*/

        // Explosion
        for (var i = margin; i < (cells - margin) / 10 * 7; i++) {
            for (var j = margin; j < (cells - margin) / 10; j++) {
                for (var k = 0; k < directions.length; k++) {
                    board[i][j].push(directions[k]);
                }
            }
        }
        for (var i = margin; i < (cells - margin) / 10 * 8; i++) {
            for (var k = 0; k < directions.length; k++) {
                board[i][parseInt(cells / 10)] = ['w'];
            }
        }

        // Explosion 2
        /*for (var i = margin; i < (cells - margin) / 4; i++) {
            for (var j = margin; j < (cells - margin) / 4; j++) {
                for (var k = 0; k < directions.length; k++) {
                    board[i][j].push(directions[k]);
                }
            }
        }*/

        for (var i = 0; i < cells; i++) {
            for (var j = 0; j < cells; j++) {
                var set = {};
                for (var k = 0; k < board[i][j].length; k++) {
                    set[board[i][j][k]] = true;
                }
                board[i][j] = [];
                if (set['w']) {
                    board[i][j].push('w');
                }
                for (var k = 0; k < directions.length; k++) {
                    if (set[directions[k]]) {
                        board[i][j].push(directions[k]);
                    }
                }
            }
        }
    }
    
    $('#cleargas').click(function() {
        for (var i = 0; i < height; i++) {
            for (var j = 0; j < width; j++) {
                var wall = false;
                for (var k = 0; k < board[i][j].length; k++) {
                    if (board[i][j][k] === 'w') {
                        wall = true;
                        break;
                    }
                }
                if (wall) {
                    board[i][j] = ['w'];
                }
                else {
                    board[i][j] = [];
                }
            }
        }
        update();
    });
    
    $('#clearwalls').click(function() {
        for (var i = 0; i < height; i++) {
            for (var j = 0; j < width; j++) {
                for (var k = 0; k < board[i][j].length; k++) {
                    if (board[i][j][k] === 'w') {
                        board[i][j].splice(k, 1);
                        break;
                    }
                }
            }
        }
        var margin = board[0].length / boardSize;
        for (var i = 0; i < cells; i++) {
            for (var j = 0; j < margin; j++) {
                board[i][j] = ['w'];
                board[j][i] = ['w'];
                board[i][cells - 1 - j] = ['w'];
                board[cells - 1 - j][i] = ['w'];
            }
        }
        update();
    });
    
    $('#reset').click(function() {
        reset();
        update();
    });
}

$(function() {
    start();
    
    $('input').on('click change', updateVariables);
    
    $('.number-spinner button').on('click', function () {
        var btn = $(this);
        updateSpinner(btn);
    });
    $('.number-spinner input').on('change', function () {    
        var input = $(this);
        var val = parseFloat(input.val().trim());
        var min = parseFloat(input.attr('data-min')) || 0;
        var max = parseFloat(input.attr('data-max'));
        max = max || max ? max : 100;
        val = Math.max(min, Math.min(max, val)) || 0;
        input.val(val);
    });
    function updateSpinner(btn) {
        var input = btn.closest('.number-spinner').find('input');
        var oldValue = parseFloat(input.val().trim());
        var newVal = 0;

        if (btn.attr('data-dir') == 'up') {
            newVal = parseFloat(oldValue + (parseFloat(input.attr('data-interval')) || 1));
        } else {
            newVal = parseFloat(oldValue - (parseFloat(input.attr('data-interval')) || 1));
        }
        var min = parseFloat(input.attr('data-min')) || 0;
        var max = parseFloat(input.attr('data-max'));
        max = max || max ? max : 100;
        newVal = Math.max(min, Math.min(max, newVal)) || 0;
        input.val(newVal);
    }
    
    $('.number-spinner input').on('change', function() {
        updateVariables();
    });

    $('.number-spinner button').on('click', function() {
        updateVariables();
    });
    
    function updateVariables() {
        paused = $('#paused').is(':checked');
        speed = parseInt($('#speed').val()) || 1;
        randomFactor = parseFloat($('#randomfactor').val()) / 100;
        random = $('#random').is(":checked");
        gas = $('#gas').is(":checked");
        wall = $('#wall').is(":checked");
        eraser = $('#eraser').is(":checked");
        brush = parseInt($('#brush').val()) || 1;
        drawVectors = $('#vectors').is(":checked");
    }
    
    updateVariables();
});

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function shuffle(a) {
    var j, x, i;
    for (i = a.length; i; i--) {
        j = Math.floor(Math.random() * i);
        x = a[i - 1];
        a[i - 1] = a[j];
        a[j] = x;
    }
}