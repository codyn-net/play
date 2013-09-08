var colors = [
    "#268BD2",
    "#859900",
    "#DC322F",
    "#2AA198",
    "#D33682",
    "#B58900",
    "#6C71C4",
    "#CB4B16"
];

var spacesInsteadOfTabs = function(cm) {
var spaces = Array(cm.getOption("indentUnit") + 1).join(" ");
    cm.replaceSelection(spaces, "end", "+input");
}

var cm = CodeMirror.fromTextArea(document.getElementById('code'), {
    indentUnit: 4,
    tabSize: 4,
    lineNumbers: true,
    mode: 'codyn',
    autoFocus: true,
    extraKeys: {
        Tab: spacesInsteadOfTabs,
    },
});

var check_timeout = 0;
var check_delay = 500;
var error_marker = null;

function process_parser_error(ret) {
    error_marker = cm.markText({line: ret.error.line[0] - 1,
                                ch: ret.error.column[0] - 1},

                               {line: ret.error.line[1] - 1,
                                ch: ret.error.column[1]},

                               {className: 'cm-error',
                               inclusiveRight: true,
                               inclusiveLeft: false,
                               title: ret.error.message});

    $('#status').text(ret.error.message);
    $('#status').addClass('error');
}

function plot_run(data) {
    var series = [];
    var i = 0;

    for (var prop in data.data) {
        var yval = data.data[prop];
        var d = [];

        for (var j = 0; j < yval.length; ++j) {
            d.push([data.t[j], yval[j]]);
        }

        var serie = {
            label: prop,
            data: d,
            color: colors_html[i % colors_html.length],
        }

        i++;
        series.push(serie);
    }

    var options = {
        grid: {
            hoverable: true,
        },

        selection: {
            mode: 'xy',
        }
    };

    $.plot('#plot', series, options);
}

function show_plot_tooltip(x, y, contents) {
    var tp = $('#plot_tooltip');
    var cb;

    if (tp.length == 0) {
        tp = $('<div id="plot_tooltip"/>');

        cb = function(e) {
            e.fadeIn(200);
        };
    } else {
        cb = function(e) {
            e.show();
        };
    }

    tp.text(contents);

    tp.css({
        position: 'absolute',
        display: 'none',
        top: y + 5,
        left: x + 5,
    }).appendTo("body");

    cb(tp);
}

var previous_point = null;

$('#plot').bind('plothover', function(ev, pos, item) {
    if (!item) {
        $('#plot_tooltip').remove();
        previous_point = null;
        return;
    }

    var pt = [item.seriesIndex, item.dataIndex];

    if (previous_point != pt) {
        previous_point = pt;

        var x = item.datapoint[0].toFixed(2);
        var y = item.datapoint[1].toFixed(5);

        show_plot_tooltip(item.pageX, item.pageY, item.series.label + " at " + x + " = " + y);
    }
});

function do_check() {
    if (check_timeout != 0) {
        clearTimeout(check_timeout);
        check_timeout = 0;
    }

    $.ajax({
        type: 'POST',
        url: '/check/',
        dataType: 'json',

        data: {
            document: cm.getValue(),
        },

        success: function(ret) {
            if (error_marker != null) {
                error_marker.clear();
                error_marker = null;
            }

            if (ret.status != 'ok') {
                process_parser_error(ret);
            } else {
                $('#status').text('');
                $('#status').removeClass('error');
            }
        },
    });
}

cm.on('change', function() {
    if (check_timeout != 0) {
        clearTimeout(check_timeout);
    }

    check_timeout = setTimeout(function() {
            check_timeout = 0;
            do_check();
    }, check_delay);
});

$('#button-check').click(function() {
    do_check();
});

$('#button-run').click(function() {
    $.ajax({
        type: 'POST',
        url: '/run/',
        dataType: 'json',

        data: {
            document: cm.getValue(),
        },

        success: function(ret) {
            if (error_marker != null) {
                error_marker.clear();
                error_marker = null;
            }

            if (ret.status == 'error') {
                process_parser_error(ret);
            } else if (ret.status == 'compile-error') {
                $('#status').text(ret.error);
                $('#status').addClass('error');
            } else {
                plot_run(ret);
                $('#status').text('');
                $('#status').removeClass('error');
            }
        },
    });
});

$('#button-share').click(function() {
    $.ajax({
        type: 'PUT',
        url: '/d/',
        dataType: 'json',
        data: {
            document: cm.getValue(),
        },
        success: function(ret) {
            window.history.pushState({'codyn': true, 'hash': ret.hash}, '', '/d/' + ret.hash);
            $('#status').html($('<input type="text"/>').val(document.location.href));
            $('#status input').select();
        },
    });
});

window.addEventListener('popstate', function(e) {
    if (e.state == null) {
        return;
    }

    var url = document.location.pathname;

    if (url.slice(0, 3) == '/d/') {
        $.get(url + '.cdn', {}, function (data) {
            if (data[data.length-1] == '\n') {
                data = data.slice(0, data.length-1);
            }

            cm.setValue(data);
        }, 'text');
    } else {
        document.location.reload();
    }
});

do_check();

/* vi:ts=4:et */
