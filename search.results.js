'use strict';

// TODO: move me to assets

class ResultView {
    constructor(view, results) {
        this.view = {
            el: view, // results view
            height: 0,
        };
        this.results = {
            el: [].slice.call(results), // results list
            height: 0,
            visible: 0,
            skippable: 0,
        }
        this.staged = {
            view: {
                top: 0,
                bot: 0,
                calc: () => {
                    const stage = this.staged.view;
                    const bounds = this.view.el.getBoundingClientRect();
                    stage.top = bounds.top;
                    stage.bot = bounds.top + this.view.height;
                    return view;
                },
            },
            selected: {
                top: 0,
                bot: 0,
                index: 0,
                calc: (i = this.staged.selected.index) => {
                    const sel = this.staged.selected;
                    const bounds = this.results.el[i].getBoundingClientRect();
                    sel.top = bounds.top;
                    sel.bot = bounds.top + this.results.height;
                    return sel;
                },
            }
        };
        this.easing = {
            current: 0,
            start: 0,
            finish: 0,
            speed: 15,
            active: false,
            fn: {
                // https://kirupa.googlecode.com/svn/trunk/easing.js
                // i = current iteration, s = start value, c = change in value, t = total iterations
                easeOutCubic: (i,s,c,t) => c * (Math.pow(i / t - 1, 3) + 1) + s,
                easeLinear: (i,s,c,t) => c * i / t + s,
            },
        };
        this.class = {
            selected: 'selected',
            blurred: 'blurred',
            result: 'result',
        };
        this.config = {
            focus: false,
            easing: true,
        }

        this._init();
    }
    _init() {
        this.compute(); // initial computation
        document.addEventListener('keydown', (e) => {
            if (this.config.focus) {
                if (this.keys(e.which)) {
                    this.stage();
                    e.preventDefault();
                }
            }
        });
        this.view.el.addEventListener('click', (e) => {
            if (this.config.focus) {
                const result = e.target.closest('.' + this.class.result);
                let index, findIndex = this.results.el.some((item, i) => {
                    index = i;
                    return item == result;
                });

                if (findIndex && this.staged.selected.index !== index) {
                    this.deselect().select(index).stage();
                    e.preventDefault();
                }
            }
        });
    }
    _computeHeight(el) {
        const computed = window.getComputedStyle(el);
        let height = el.clientHeight;

        if (computed.marginBottom != '0px')
            height += parseInt(computed.marginBottom, 10);
        if (computed.marginTop != '0px')
            height += parseInt(computed.marginTop, 10);

        return height;
    }
    _computeVisible() {
        return this.view.height / this.results.height;
    }
    _computeSkippable({ results: { visible }} = this) {
        const middle = Math.floor(visible / 2);
        return (middle < 2) ? 1 : middle;
    }

    compute() {
        this.view.height = this._computeHeight(this.view.el);
        this.results.height = this._computeHeight(this.results.el[0]);
        this.results.visible = this._computeVisible();
        this.results.skippable = this._computeSkippable();
    }
    keys(keyCode) {
        const start = 0;
        const end = this.results.el.length - 1;
        let index = this.staged.selected.index;

        switch (keyCode) {
            case 40: // "down"
                if (index < end) {
                    this.deselect(index).select(++index);
                }
                return true;
            case 38: // "up"
                if (index > start) {
                    this.deselect(index).select(--index);
                }
                return true;
            case 34: // "page down"
                if (index < end) {
                    this.deselect(index);
                    index += this.results.skippable;
                    this.select((index < end) ? index : end);
                }
                return true;
            case 33: // "page up"
                if (index > start) {
                    this.deselect(index);
                    index -= this.results.skippable;
                    this.select((index > start) ? index : start);
                }
                return true;
            case 36: // "home"
                if (index !== start) {
                    this.deselect(index).select(start);
                }
                return true;
            case 35: // "end"
                if (index !== end) {
                    this.deselect(index).select(end);
                }
                return true;
        }
        return false;
    }
    focus() {
        this.config.focus = true;
        this.view.el.classList.remove(this.class.blurred);
        this.select();
        return this;
    }
    blur() {
        this.config.focus = false;
        this.view.el.classList.add(this.class.blurred);
        return this;
    }
    select(index = this.staged.selected.index) {
        this.results.el[index].classList.add(this.class.selected);
        this.staged.selected.index = index;
        return this;
    }
    deselect(index = this.staged.selected.index) {
        this.results.el[index].classList.remove(this.class.selected);
        return this;
    }
    clear() {
        this.staged.selected.index = 0;
        for (let [i, c, r] = [0, this.class.selected, this.results.el]; i < r.length; i++) {
            r[i].classList.remove(c);
        }
        return this;
    }
    stage({ view: { el: view }, easing } = this, { view: stage, selected } = this.staged) {
        const index = selected.index;

        // calc new positions
        stage.calc();
        selected.calc(index);

        // selected item is lower or higher than results view
        if (selected.bot >= stage.bot) {
            easing.finish = (index - (this.results.visible - 1)) * this.results.height; // align to bottom
        } else if (selected.top <= stage.top) {
            easing.finish = index * this.results.height; // align to top
        } else {
            easing.finish = view.scrollTop; // keep alignment
        }

        if (this.config.easing) {
            if (easing.active) {
                // already easing
                easing.start = view.scrollTop;
                easing.current = 0;
            } else {
                // starting position
                easing.start = view.scrollTop;
                easing.current = 0;

                // begin easing
                if (easing.start != easing.finish) {
                    easing.active = true;

                    // begin sequence
                    this.sequence((deltaT) => {
                        // calculate easing
                        view.scrollTop = easing.fn.easeOutCubic(++easing.current, easing.start, easing.finish - easing.start, easing.speed);

                        // prevent misalignment
                        if (easing.start < easing.finish && view.scrollTop > easing.finish ||
                            easing.start > easing.finish && view.scrollTop < easing.finish) {
                            view.scrollTop = easing.finish;
                        }

                        // reached destination, reset easing
                        if (view.scrollTop == easing.finish) {
                            easing.current = 0;
                            return easing.active = false; // terminate sequence
                        }
                    });
                }
            }
        } else {
            view.scrollTop = easing.finish;
        }
    }
    sequence(render) {
        let running, previous = +new Date,
            loop = (current) => {
                // stop the loop if render returns false
                if (running !== false) {
                    requestAnimationFrame(loop);
                    running = render(current - previous);
                    previous = current;
                }
            }
        loop(previous);
    }
}
