"use strict";

var plot_selection = null;
var plot_data = null;

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

var previousHidden = {};

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

function update_plot() {
    var series = [];
    var idx = 0;

    var onlyout = $('#plot-only-out')[0].checked;
    var indexMap = {};

    for (var i = 0; i < plot_data.data.length; i++) {
        var d = plot_data.data[i];

        if (onlyout && d.flags.indexOf('out') === -1) {
            continue;
        }

        var yval = d.data;
        var data = [];

        for (var j = 0; j < yval.length; ++j) {
            data.push([plot_data.t[j], yval[j]]);
        }

        var serie = {
            label: d.name,
            data: data,
            color: colors_html[idx % colors_html.length],
            downsample: {
                threshold: 300
            }
        };

        indexMap[d.name] = idx;

        idx++;
        series.push(serie);
    }

    series.sort(function(a, b) {
        return a.label < b.label ? -1 : (a.label > b.label ? 1 : 0);
    });

    var origseries = series.slice(0);

    var options = {
        grid: {
            hoverable: true
        },

        selection: {
            mode: 'xy'
        }
    };

    if (plot_selection != null) {
        options.xaxis = { min: plot_selection.xaxis.from, max: plot_selection.xaxis.to };
        options.yaxis = { min: plot_selection.yaxis.from, max: plot_selection.yaxis.to };
    }

    var np = {};

    var hiddenSeries = function(i) {
        return {
                label: origseries[i].label,
                data: [],
                color: origseries[i].color,
                downsample: origseries[i].downsample
            };
    };

    for (var k in previousHidden) {
        if (k in indexMap) {
            var ii = indexMap[k];

            np[k] = true;
            series[ii] = hiddenSeries(ii);
        }
    }

    previousHidden = np;

    var makePlot;
    var pl;

    makePlot = function() {
        $.plot('#plot', series, options);

        var ltds = $('#plot div.legend td.legendColorBox');

        for (var k in previousHidden) {
            $(ltds[indexMap[k]]).addClass('hidden');
        }

        $.each(ltds, function(i, td) {
            td = $(td);

            td.on('click', function() {
                if (td.hasClass('hidden')) {
                    series[i] = origseries[i];
                    delete previousHidden[series[i].label];
                } else {
                    series[i] = hiddenSeries(i);
                    previousHidden[series[i].label] = true;
                }

                makePlot();
            });
        });
    };

    makePlot();
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

$('#plot').bind('plotselected', function (event, ranges) {
    plot_selection = ranges;
    update_plot();
});

$('#plot').bind('plotunselected', function (event) {
    plot_selection = null;
    update_plot();
});

function set_status(message, errorclass) {
    var st = $('#status');

    if (typeof(message) == "string") {
        st.text(message);
    } else {
        st.html(message);
    }

    st.removeClass();
    st.addClass(errorclass);
    st.show();
}

function clear_status() {
    var st = $('#status');

    st.text('');
    st.removeClass();
    st.hide();
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

                var cs = $('#continously-simulate-button');

                if (cs.prop('checked'))
                {
                    do_run();
                }
            }
        },

        error: function(ret) {
            set_status(ret.responseText, 'small-error');
        }
    });
}

function do_run() {
    set_status('Simulating network...');

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
                plot_data = ret;
                plot_selection = null;

                update_plot();
                clear_status();
            }
        },

        error: function(ret) {
            set_status(ret.responseText, 'error');
        }
    });
}

function put_document(cb) {
    $.ajax({
        type: 'PUT',
        url: '/d/',
        dataType: 'json',

        data: {
            document: cm.getValue()
        },

        success: function(ret) {
            cb(ret);
        },

        error: function(ret) {
            set_status(ret.responseText, 'small-error');
        }
    });
}

function do_share(cb) {
    put_document(function(ret) {
        window.history.pushState({'codyn': true, 'hash': ret.hash}, '', '/d/' + ret.hash);

        if (cb) {
            cb(ret);
        } else {
            var d = $('<span><em>Shared at:</em> </span>');
            var url = $('<input type="text" size="60"/>').val(document.location.href);

            d.append(url);

            set_status(d);
            $('#status input').select();
        }
    })
}

function do_download() {
    do_share(function(ret) {
        document.location = '/d/' + ret.hash + '.cdn?download=1';
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

$('#button-download').click(function() {
    do_download();
});

$('#plot-only-out').on('change', function() {
    if (!plot_data) {
        do_run();
    } else {
        update_plot();
    }
});

$('#continously-simulate-button').change(function() {
    if (this.checked) {
        do_run();
    }

    return true;
});

$('#continously-simulate-button').click(function(e) {
    e.stopPropagation();
    return true;
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
