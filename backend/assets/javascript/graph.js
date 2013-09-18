"use strict";

var Node = function(obj) {
	this.obj = obj;
};

Node.prototype.render = function(ctx, text) {
	ctx.beginPath();
	ctx.strokeStyle = '#287bc5';
	ctx.fillStyle = '#35a3ff';
	ctx.rect(0.1, 0.1, 0.3, 0.3);
	ctx.closePath();

	ctx.fill();
	ctx.stroke();

	ctx.beginPath();
	ctx.fillStyle = '#ffa335';
	ctx.strokeStyle = '#c57b28';
	ctx.rect(0.6, 0.1, 0.3, 0.3);
	ctx.closePath();

	ctx.fill();
	ctx.stroke();

	ctx.beginPath();
	ctx.fillStyle = '#a335ff';
	ctx.strokeStyle = '#8a49c5';
	ctx.rect(0.1, 0.6, 0.3, 0.3);
	ctx.closePath();

	ctx.fill();
	ctx.stroke();

	ctx.beginPath();
	ctx.fillStyle = '#35ffa3';
	ctx.strokeStyle = '#49c58a';
	ctx.rect(0.6, 0.6, 0.3, 0.3);
	ctx.closePath();

	ctx.fill();
	ctx.stroke();

	ctx.beginPath();
	ctx.fillStyle = '#a3ff35';
	ctx.strokeStyle = '#7bc528';
	ctx.rect(0.3, 0.3, 0.4, 0.4);
	ctx.closePath();

	ctx.fill();
	ctx.stroke();

	ctx.fillStyle = '#333';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'top';
	text(ctx, this.obj.id, 0.5, 1.1);
};

var Edge = function(obj) {
	this.obj = obj;
	this.offset = 0;
	this._control_points = null;
};

Edge.prototype._evaluate_bezier_coord = function(p0, p1, p2, p3, t) {
	return Math.pow(1 - t, 3) * p0 +
	       3 * t * Math.pow(1 - t, 2) * p1 +
	       3 * Math.pow(t, 2) * (1 - t) * p2 +
	       Math.pow(t, 3) * p3;
};

Edge.prototype._evaluate_bezier = function(points, t) {
	return {
		x: this._evaluate_bezier_coord(points[0].x, points[1].x, points[2].x, points[3].x, t),
		y: this._evaluate_bezier_coord(points[0].y, points[1].y, points[2].y, points[3].y, t)
	};
};

Edge.prototype._calculate_control = function(from, to, offset) {
	var diff = {x: to.x - from.x, y: to.y - from.y};
	var point = {x: from.x + diff.x / 2, y: from.y + diff.y / 2};
	var same = (diff.x == 0 && diff.y == 0);

	var dist = offset;
	var alpha = same ? 0 : Math.atan(diff.x / -diff.y);

	if (diff.y >= 0) {
		alpha += Math.PI;
	}

	return {x: point.x + Math.cos(alpha) * dist, y: point.y + Math.sin(alpha) * dist};
};

Edge.prototype.update = function() {
	if (this.obj.input == null || this.obj.output == null) {
		this._control_points = [];
		return;
	}

	var from = {x: this.obj.input.obj.x + 0.5, y: this.obj.input.obj.y + 0.5};
	var to = {x: this.obj.output.obj.x + 0.5, y: this.obj.output.obj.y + 0.5};

	var control = this._calculate_control(from, to, this.offset);

	if (from.x == to.x && from.y == to.y) {
		var pts = {x: 2, y: this.offset + 0.5};

		this._control_points = [
			from,
			{x: to.x - pts.x, y: to.y - pts.y},
			{x: to.x + pts.x, y: to.y - pts.y},
			to
		];
	} else {
		this._control_points = [
			from,
			control,
			control,
			to
		];
	}
};

Edge.prototype.control_points = function() {
	if (this._control_points == null) {
		this.update();
	}

	return this._control_points;
};

Edge.prototype._draw_arrow = function(ctx, x, y, pos) {
	ctx.translate(x, y);
	ctx.rotate(pos);
	ctx.translate(-x, -y);

	ctx.beginPath();

	var size = 0.15;

	var x0 = x;
	var y0 = y + (pos + 0.5 * Math.PI < Math.PI ? -1 : 1) * size / 2;

	ctx.moveTo(x0, y0);
	ctx.lineTo(x0 - size, y0);
	ctx.lineTo(x0, y0 - size);
	ctx.lineTo(x0 + size, y0);

	ctx.closePath();
	ctx.fill();
};

Edge.prototype.render = function(ctx) {
	var control = this.control_points();

	if (control.length == 0) {
	
	} else {
		ctx.strokeStyle = '#d4e2f0';
		ctx.fillStyle = '#d4e2f0';

		ctx.beginPath();
		ctx.moveTo(control[0].x, control[0].y);

		ctx.bezierCurveTo(control[1].x, control[1].y,
		                  control[2].x, control[2].y,
		                  control[3].x, control[3].y);

		ctx.stroke();

		var xy = this._evaluate_bezier(control, 0.5);
		var pos = 0;

		if (control[0].x == control[3].x && control[0].y == control[3].y) {
			pos = 0.5 * Math.PI;
		} else {
			var diff = {x: control[3].x - control[0].x, y: control[3].y - control[0].y};

			if (diff.x == 0) {
				pos = (diff.y < 0 ? 1.5 : 0.5) * Math.PI;
			} else {
				if (diff.y != 0) {
					pos = Math.atan(diff.Y / diff.X);
				}

				if (diff.x < 0) {
					pos += Math.PI;
				} else if (diff.y < 0) {
					pos += 2 * Math.PI;
				}
			}

			pos += 0.5 * Math.PI;
		}

		this._draw_arrow(ctx, xy.x, xy.y, pos);
	}
};

var Graph = {
	canvas: null,

	_network: null,
	_objects: null,

	x: 0,
	y: 0,

	mouse_state: 0,

	unit: 50,

	target: {
		unit: 50,
		x: 0,
		y: 0
	},

	min_unit: 10,
	max_unit: 200,

	_render_grid: function(ctx) {
		ctx.save();

		var c = this.canvas.get(0);
		var w = c.width;
		var h = c.height;

		var x = this.x % this.unit;

		if (x == 0) {
			x += this.unit;
		}

		var y = this.y % this.unit;

		if (y == 0) {
			y += this.unit;
		}

		ctx.setLineWidth(1);
		ctx.strokeStyle = '#eeeeec';

		ctx.beginPath();

		while (x < w) {
			ctx.moveTo(x + 0.5, 0);
			ctx.lineTo(x + 0.5, h);

			x += this.unit;
		}

		while (y < h) {
			ctx.moveTo(0, y + 0.5);
			ctx.lineTo(w, y + 0.5);
			ctx.stroke();

			y += this.unit;
		}

		ctx.closePath();
		ctx.stroke();

		ctx.restore();
	},

	set_network: function(network) {
		this._network = network;
		this._objects = [];

		var nodes = [];
		var edges = [];

		var nodemap = {};

		var x = 0;
		var y = 0;

		for (var i in network.children) {
			var child = network.children[i];

			// Canvas y is basically inverse, so we invert y here
			child.y = -child.y;

			if ($.inArray('node', child.type) != -1) {
				var obj = new Node(child);
				nodes.push(obj);
				nodemap[child.id] = obj;

				x += child.x;
				y += child.y;
			} else if ($.inArray('edge', child.type) != -1) {
				obj = new Edge(child);
				edges.push(obj);
			}
		}

		if (nodes.length > 0) {
			x /= nodes.length;
			y /= nodes.length;
		}

		var offsetid = function(a, b) {
			return '{' + a + '}{' + b + '}';
		}

		var offsets = {};

		for (var i in edges) {
			var edge = edges[i];

			var input = edge.obj.input;
			var output = edge.obj.output;

			if (input != null && output != null) {
				var id = offsetid(input, output);

				edge.obj.input = nodemap[input];
				edge.obj.output = nodemap[output];

				if (id in offsets) {
					edge.offset = offsets[id][offsets[id].length - 1].offset + 1;
					offsets[id].push(edge);
				} else {
					var revid = offsetid(output, input);

					if (revid in offsets) {
						for (var ot in offsets[revid]) {
							offsets[revid][ot].offset += 1;
						}

						edge.offset = 1;
					}

					offsets[id] = [edge];
				}
			}

			this._objects.push(edge);
		}

		for (var i in nodes) {
			this._objects.push(nodes[i]);
		}

		$(this).stop();

		this.x = Math.round(this.canvas.width() / 2 - x * this.unit);
		this.y = Math.round(this.canvas.height() / 2 - y * this.unit);

		this.target.x = this.x;
		this.target.y = this.y;

		this.render();
	},

	_render_network: function(ctx) {
		ctx.save();

		var unit = this.unit;
		var unitinv = 1 / this.unit;

		ctx.translate(this.x + 0.5, this.y + 0.5);
		ctx.scale(unit, unit);
		ctx.setLineWidth(unitinv);

		var textrender = function(ctx, text, x, y) {
			ctx.save();

			ctx.scale(unitinv, unitinv);
			ctx.fillText(text, Math.round(unit * x), Math.round(unit * y));

			ctx.restore();
		};

		for (var o in this._objects) {
			o = this._objects[o];

			ctx.save();
			ctx.translate(o.obj.x, o.obj.y);

			o.render(ctx, textrender);

			ctx.restore();
		}

		ctx.restore();
	},

	render: function() {
		var c = this.canvas.get(0);
		var ctx = c.getContext('2d');

		ctx.clearRect(0, 0, c.width, c.height);

		this._render_grid(ctx);

		if (this._network != null) {
			this._render_network(ctx);
		}
	},

	_mousemove: function(e) {
		if (this.mouse_state == 0) {
			return;
		}

		this.x = this._dragging_orig[0] + (e.pageX - this._dragging[0]);
		this.y = this._dragging_orig[1] + (e.pageY - this._dragging[1]);

		$(this).stop();

		this.target.x = this.x;
		this.target.y = this.y;

		this.render();
	},

	_mousedown: function(e) {
		this._dragging = [e.pageX, e.pageY];
		this._dragging_orig = [this.x, this.y];
	},

	zoom: function(direction, at) {
		var newunit;

		if (direction > 0) {
			newunit = this.target.unit * 1.1;
		} else {
			newunit = this.target.unit * 0.9;
		}

		newunit = Math.round(newunit);

		if (newunit > this.max_unit) {
			newunit = this.max_unit;
		} else if (newunit < this.min_unit) {
			newunit = this.min_unit;
		}

		if (newunit == this.target.unit) {
			return;
		}

		var newx = this.target.x;
		var newy = this.target.y;

		if (at) {
			var ratio = newunit / this.target.unit;

			newx += (at.x - ((at.x - this.target.x) * ratio + this.target.x));
			newy += (at.y - ((at.y - this.target.y) * ratio + this.target.y));

			newx = Math.round(newx);
			newy = Math.round(newy);
		}

		$(this).stop();

		this.target.unit = newunit;
		this.target.x = newx;
		this.target.y = newy;

		var a = $(this).animate(
			{
				unit: newunit,
				x: newx,
				y: newy
			},

			{
				duration: 240,
				step: function() {
					this.render();
				}
			}
		);
	},

	set: function(canvas) {
		this.canvas = canvas;

		var container = canvas.parent().find('> .content');

		var sizing = function () {
			canvas.get(0).width = container.width() - 1;
			canvas.get(0).height = container.height() - 1;

			Graph.render();
		}

		sizing();

		$(window).on('resize', sizing);

		canvas.on('mousemove', function (e) {
			Graph._mousemove(e);
		});

		canvas.on('mousewheel', function(e) {
			var delta = e.originalEvent.wheelDeltaY;

			var po = $(this).offset();
			var at = {x: e.pageX - po.left, y: e.pageY - po.top};

			if (delta > 0) {
				Graph.zoom(1, at);
			} else if (delta < 0) {
				Graph.zoom(-1, at);
			}
			
		});
	}
}

$(document).ready(function() {
	Graph.set($('#graph'));

	$(document).on('mousedown', function(e) {
		if (e.target == Graph.canvas.get(0)) {
			Graph.mouse_state = e.which;
			Graph._mousedown(e);
		}
	});

	$(document).on('mouseup', function(e) {
		Graph.mouse_state = 0;
	})

	

	Graph.render({});
})
