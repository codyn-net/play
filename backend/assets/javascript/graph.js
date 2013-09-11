var Graph = {
	canvas: null,

	x: 0,
	y: 0,
	mouse_state: 0,

	grid_spacing: 50,

	_grid: function(ctx) {
		var c = this.canvas.get(0);
		var w = c.width;
		var h = c.height;

		var x = this.x % this.grid_spacing;

		if (x == 0) {
			x += this.grid_spacing;
		}

		var y = this.y % this.grid_spacing;

		if (y == 0) {
			y += this.grid_spacing;
		}

		ctx.setLineWidth(1);
		ctx.strokeStyle = '#eee';

		ctx.beginPath();

		while (x < w) {
			ctx.moveTo(x + 0.5, 0);
			ctx.lineTo(x + 0.5, h);

			x += this.grid_spacing;
		}


		while (y < h) {
			ctx.moveTo(0, y + 0.5);
			ctx.lineTo(w, y + 0.5);
			ctx.stroke();

			y += this.grid_spacing;
		}

		ctx.closePath();
		ctx.stroke();
	},

	render: function() {
		var c = this.canvas.get(0);
		var ctx = c.getContext('2d');

		ctx.clearRect(0, 0, c.width, c.height);

		this._grid(ctx);
	},

	_mousemove: function(e) {
		if (this.mouse_state == 0) {
			return;
		}

		this.x = this._dragging_orig[0] + (e.pageX - this._dragging[0]);
		this.y = this._dragging_orig[1] + (e.pageY - this._dragging[1]);

		this.render();
	},

	_mousedown: function(e) {
		this._dragging = [e.pageX, e.pageY];
		this._dragging_orig = [this.x, this.y];
	},

	set: function(canvas) {
		this.canvas = canvas;

		canvas.get(0).width = canvas.width();
		canvas.get(0).height = canvas.height();

		canvas.on('mousemove', function (e) {
			Graph._mousemove(e);
		});
	}
}

$(window).on('load', function() {
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
