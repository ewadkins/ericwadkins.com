$(function() {
        
    var intervalId;
    var xhr;
    
    $('#cancel').prop('disabled', true);
    $('#footer').prop('hidden', true);
    
    $('#reset').click(function(e) {
        e.preventDefault();
        location.reload();
    });
    
    $('#cancel').click(function(e) {
        e.preventDefault();
        xhr.abort();
        clearInterval(intervalId);
        $('#output').empty().html("<h4>Request cancelled!");
        $('#generate').prop('disabled', false);
        $('#cancel').prop('disabled', true);
    });

    $('.positiveIntegers').on('change keyup paste', function() {
        var oldValue = $(this).val();
        var newValue = oldValue.replace(/[^0-9]/g,'');
        if (oldValue != newValue) {
            $(this).val(newValue);
        }
        updateDisplay();
    });
    
    $('#grid').on('change', function() {
        updateDisplay();
    })
    
    var oldVal = '';
    $('#textinput').on('change keyup paste', function() {
        var currentVal = $(this).val();
        if(currentVal == oldVal) {
            return;
        }
        oldVal = currentVal;
        
        var lines = $(this).val().split('\n');
        $(this).attr('rows', lines.length);
        var selectionStart = $(this).prop('selectionStart');
        var selectionEnd = $(this).prop('selectionEnd');
        $(this).val($(this).val().replace(/[^ \r\n]/g, '#'));
        $(this).val($(this).val().replace(/[^#\r\n]/g, ' '));
        if (selectionStart === selectionEnd) {
            $(this)[0].setSelectionRange(selectionStart, selectionEnd);
        }
        updateDisplay();
    });
    
    var defaultText
    = '##  ## ##### ##    ##    ###### ##\n'
    + '##  ## ##### ##    ##    ###### ##\n'
    + '##  ## ##    ##    ##    ##  ## ##\n'
    + '###### ##### ##    ##    ##  ## ##\n'
    + '###### ##### ##    ##    ##  ## ##\n'
    + '##  ## ##    ##    ##    ##  ##   \n'
    + '##  ## ##### ##### ##### ###### ##\n'
    + '##  ## ##### ##### ##### ###### ##';
    
    $('#textinput').val(defaultText);
    $('#textinput').change();
    
    $('#form').submit(function(e) {
        e.preventDefault();
        var filename = $("#fileinput").val();
        var extension = filename.replace(/^.*\./, '');
        if (!extension || extension !== 'zip') {
            alert('Please choose a .zip file to upload.');
            return;
        }
        //$("html, body").animate({ scrollTop: 0 }, "slow");
        $('#generate').prop('disabled', true);
        $('#cancel').prop('disabled', false);
        $('#footer').prop('hidden', true);
        var xScale = parseInt($('#xscale').val());
        var yScale = parseInt($('#yscale').val());
        var scaled = scaleText($('#textinput').val(), xScale, yScale);
        var original = $('#textinput').val();
        $('#textinput').val(scaled);
        var formData = new FormData($(this)[0]);
        $('#textinput').val(original);
        //'<i class="fa fa-circle-o-notch fa-spin fa-2x fa-fw"></i><h3 style="padding-left:12px;display:inline-block"><span id="status">Requesting</span>...</h3>'
        $('#output').html('<p><strong id="status">Requesting</strong>...<span class="pull-right text-muted" id="progressText">Waiting</span></p>'
                          + '<div class="progress progress-striped active"><div class="progress-bar progress-bar-success" id="progress" style="width: 0%"></div></div>');
        xhr = $.ajax({
            type: 'POST',
            contentType: 'multipart/form-data',
            url: '/api/collage',
            data: formData,
            processData: false,
            contentType: false
        })
        .success(function(data) {
            clearInterval(intervalId);
            $('#generate').prop('disabled', false);
            $('#cancel').prop('disabled', true);
            $('#output').empty().html('<a href="data:image/jpeg;base64,' + data + '" target="blank">'
                                      + '<img style="max-height:100%; max-width:100%;" src="data:image/jpeg;base64,' + data + '"></img></a>');
            $('#footer').prop('hidden', false);
        })
        .error(function(xhr) {
            if (xhr.status == 403) {
                $('#output').empty().html("<h4>Could not complete your request. A request has already been sent from this IP address.</h4>");
            }
            else if (xhr.status == 400) {
                $('#output').empty().html("<h4>Could not complete your request. No .jpg images were found in the uploaded .zip file.</h4>");
            }
            else {
                $('#output').empty().html("<h4>Could not complete your request. An error has occurred.</h4>");
            }
            $('#generate').prop('disabled', false);
            $('#cancel').prop('disabled', true);
            clearInterval(intervalId);
        });
        
        intervalId = setInterval(function() {
            $.get('/api/collage/progress', function(data) {
                if (data.status === 'Generating') {
                    var percent = parseInt(100 * data.progress);
                    $('#progressText').html(parseInt(100 * data.progress) + '% Complete');
                    $('#progress').width(percent + '%');
                }
                $('#status').html(data.status);
            })
            .error(function(xhr, textStatus, errorThrown) {
                clearInterval(intervalId);
            });
        }, 300, 0);
    });
    
    
    alert('The Collage Generator server is not live at the moment and will not return a response.');
    

});

function updateDisplay() {
    var size = parseInt($('#size').val());
    var xScale = parseInt($('#xscale').val());
    var yScale = parseInt($('#yscale').val());
    var map = mapText($('#textinput').val(), xScale, yScale);
    var width = map[0].length * size;
    var height = map.length * size;
    var grid = $('#grid').prop('checked');
    $('#width').html(width);
    $('#height').html(height);
    var div = $('#display');
    div.empty();
    var html = '';
    html += '<div style="overflow:auto"><table border="' + (grid ? 1 : 0) + '" width="' + width + 'px" height="' + height + 'px">';
    for (var i = 0; i < map.length; i++) {
        html += '<tr>';
        for (var j = 0; j < map[i].length; j++) {
            var b = map[i][j] === '#';
            html += '<td style="background-color:' + (b ? 'black' : 'white') + ';"></td>';
        }
        html += '</tr>';
    }
    html += '</table></div>';
    div.append(html);
}

function calculateSize() {
    
}

function scaleText(textinput, xScale, yScale) {
    var delimiter = textinput.indexOf('\r\n') !== -1 ? '\r\n' : '\n'; 
    var lines = textinput.split(delimiter);
    var maxLength = 0;
    var scaledLines = [];
    for (var i = 0; i < lines.length; i++) {
        var scaledLine = '';
        for (var j = 0; j < lines[i].length; j++) {
            for (var k = 0; k < xScale; k++) {
                scaledLine += lines[i][j];
            }
        }
        for (var j = 0; j < yScale; j++) {
            scaledLines.push(scaledLine);
        }
    }
    scaled = [];
    for (var i = 0; i < scaledLines.length; i++) {
        scaled.push(scaledLines[i]);
    }
    return scaled.join('\n');
}

function mapText(textinput, xScale, yScale) {
    var delimiter = textinput.indexOf('\r\n') !== -1 ? '\r\n' : '\n'; 
    var lines = textinput.split(delimiter);
    var maxLength = 0;
    for (var i = 0; i < lines.length; i++) {
        lines[i] = lines[i].replace(/[^ ]/g, '#').replace(/[^#]/g, ' ');
        if (lines[i].length > maxLength) {
            maxLength = lines[i].length;
        }
    }
    var scaledLines = [];
    for (var i = 0; i < lines.length; i++) {
        while (lines[i].length < maxLength) {
            lines[i] += ' ';
        }
        var scaledLine = '';
        for (var j = 0; j < lines[i].length; j++) {
            for (var k = 0; k < xScale; k++) {
                scaledLine += lines[i][j];
            }
        }
        for (var j = 0; j < yScale; j++) {
            scaledLines.push(' ' + scaledLine + ' ');
        }
    }
    var extraLine = '';
    for (var i = 0; i < maxLength * xScale + 2; i++) {
        extraLine += ' ';
    }
    newLines = [extraLine];
    for (var i = 0; i < scaledLines.length; i++) {
        newLines.push(scaledLines[i]);
    }
    newLines.push(extraLine);
    return newLines;
}
