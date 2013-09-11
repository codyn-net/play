"use strict";

var colors_html = [
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
        Tab: spacesInsteadOfTabs
    }
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

    set_status(ret.error.message, 'error');
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
            color: colors_html[i % colors_html.length]
        };

        i++;
        series.push(serie);
    }

    series.sort(function(a, b) {
        return a.label < b.label ? -1 : (a.label > b.label ? 1 : 0);
    });

    var options = {
        grid: {
            hoverable: true
        },

        selection: {
            mode: 'xy'
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
        left: x + 5
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

function set_status(message, errorclass) {
    var st = $('#status');

    if (typeof(message) == "string") {
        st.text(message);
    } else {
        st.html(message);
    }

    st.addClass(errorclass);
}

function clear_status() {
    var st = $('#status');

    st.text('');
    st.removeClass('error');
}


function do_check() {
    if (check_timeout != 0) {
        clearTimeout(check_timeout);
        check_timeout = 0;
    }

    $.ajax({
        type: 'POST',
        url: '/graph/',
        dataType: 'json',

        data: {
            document: cm.getValue()
        },

        success: function(ret) {
            if (error_marker != null) {
                error_marker.clear();
                error_marker = null;
            }

            if (ret.status != 'ok') {
                process_parser_error(ret);
            } else {
                Graph.set_network(ret.network);
                clear_status();
            }
        }
    });
}

function do_run() {
    $.ajax({
        type: 'POST',
        url: '/run/',
        dataType: 'json',

        data: {
            document: cm.getValue()
        },

        success: function(ret) {
            if (error_marker != null) {
                error_marker.clear();
                error_marker = null;
            }

            if (ret.status == 'error') {
                process_parser_error(ret);
            } else if (ret.status == 'compile-error') {
                set_status(ret.error, 'error');
            } else {
                plot_run(ret);
                clear_status();
            }
        }
    });
}

function do_share() {
    $.ajax({
        type: 'PUT',
        url: '/d/',
        dataType: 'json',
        data: {
            document: cm.getValue()
        },
        success: function(ret) {
            window.history.pushState({'codyn': true, 'hash': ret.hash}, '', '/d/' + ret.hash);

            set_status($('<input type="text"/>').val(document.location.href));
            $('#status input').select();
        }
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

$('#button-run').click(function() {
    do_run();
});

$('#button-share').click(function() {
    do_share();
});

var popstatehandler = function(e) {
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
};

if (window.addEventListener) {
    window.addEventListener('popstate', popstatehandler);
} else {
    window.onpopstate = popstatehandler;
}

do_check();

/* vi:ts=4:et */
