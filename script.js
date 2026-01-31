'use strict';

const MAX_VALUE = 100;
const MIN_VALUE = 0;
const FULL_CIRCLE = Math.PI * 2;

const DEFAULT_SELECTORS = {
    value: '#value',
    bar: '#bar, .form-bar',
    animate: '#toggle_animate',
    hide: '#toggle_hide'
};

function clamp(value) {
    const n = parseInt(value, 10);
    if (isNaN(n)) return MIN_VALUE;
    return Math.min(MAX_VALUE, Math.max(MIN_VALUE, n));
}

function drawCircle(ctx, radius, color, thickness, fromPercent, toPercent) {
    const startAngle = fromPercent * FULL_CIRCLE;
    const endAngle = toPercent * FULL_CIRCLE;
    ctx.beginPath();
    ctx.arc(0, 0, radius, startAngle, endAngle);
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;
    ctx.lineCap = 'round';
    ctx.stroke();
}

function queryOne(parent, selector) {
    if (!parent || !selector) return null;
    const list = selector.split(',').map(function(s) { return s.trim(); });
    for (let i = 0; i < list.length; i++) {
        const el = parent.querySelector(list[i]);
        if (el) return el;
    }
    return null;
}

function createProgressBar(config) {
    config = config || {};

    const container = config.root;
    const selectors = config.selectors || DEFAULT_SELECTORS;

    let barContainer = config.bar;
    let valueInput = config.valueInput;
    let animateCheckbox = config.animateCheckbox;
    let hideCheckbox = config.hideCheckbox;

    if (container) {
        valueInput = valueInput || queryOne(container, selectors.value);
        barContainer = barContainer || queryOne(container, selectors.bar);
        animateCheckbox = animateCheckbox || queryOne(container, selectors.animate);
        hideCheckbox = hideCheckbox || queryOne(container, selectors.hide);
    }

    if (!barContainer) {
        console.error('ProgressBar: не указан контейнер для canvas (config.bar или root + selectors.bar)');
        return null;
    }

    const hasValueCallbacks = typeof config.getValue === 'function' && typeof config.setValue === 'function';
    if (!valueInput && !hasValueCallbacks) {
        console.error('ProgressBar: нужен config.valueInput или config.getValue + config.setValue');
        return null;
    }

    const size = config.size != null ? parseInt(config.size, 10) : 160;
    const lineWidth = config.lineWidth != null ? parseInt(config.lineWidth, 10) : 10;
    const rotate = config.rotate != null ? parseInt(config.rotate, 10) : 0;
    const animatedClass = config.animatedClass != null ? config.animatedClass : 'form-bar--animated';

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    barContainer.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    ctx.translate(size / 2, size / 2);
    ctx.rotate((-90 + rotate) * (Math.PI / 180));
    const radius = (size - lineWidth) / 2;

    let getValueRef;
    let setValueRef;
    let getAnimateRef;
    let setAnimateRef;
    let getVisibleRef;
    let setVisibleRef;

    if (hasValueCallbacks) {
        getValueRef = function() { return clamp(config.getValue()); };
        setValueRef = function(v) {
            config.setValue(clamp(v));
        };
    } else {
        getValueRef = function() { return clamp(valueInput.value); };
        setValueRef = function(v) {
            valueInput.value = clamp(v);
        };
    }

    if (typeof config.getAnimate === 'function' && typeof config.setAnimate === 'function') {
        getAnimateRef = config.getAnimate;
        setAnimateRef = config.setAnimate;
    } else if (animateCheckbox) {
        getAnimateRef = function() { return !!animateCheckbox.checked; };
        setAnimateRef = function(on) {
            animateCheckbox.checked = !!on;
            barContainer.classList.toggle(animatedClass, !!on);
        };
    } else {
        getAnimateRef = function() { return false; };
        setAnimateRef = function() {};
    }

    if (typeof config.getVisible === 'function' && typeof config.setVisible === 'function') {
        getVisibleRef = config.getVisible;
        setVisibleRef = function(show) {
            config.setVisible(!!show);
            if (show) redraw();
        };
    } else if (hideCheckbox) {
        getVisibleRef = function() { return barContainer.style.display !== 'none'; };
        setVisibleRef = function(show) {
            const display = show ? 'block' : 'none';
            barContainer.style.display = display;
            canvas.style.display = display;
            if (show) redraw();
        };
    } else {
        getVisibleRef = function() { return true; };
        setVisibleRef = function(show) {
            if (show) redraw();
        };
    }

    function redraw() {
        const value = getValueRef();
        ctx.clearRect(-size / 2, -size / 2, size, size);
        drawCircle(ctx, radius, '#efefef', lineWidth, 0, 1);
        if (value > 0) {
            drawCircle(ctx, radius, '#0000FF', 8, 0, value / 100);
        }
    }

    if (valueInput) {
        function validateInput() {
            setValueRef(getValueRef());
            redraw();
        }
        valueInput.addEventListener('keyup', validateInput);
        valueInput.addEventListener('change', validateInput);
    }

    if (animateCheckbox) {
        animateCheckbox.addEventListener('change', function() {
            setAnimateRef(!!animateCheckbox.checked);
        });
    }

    if (hideCheckbox) {
        hideCheckbox.addEventListener('change', function() {
            setVisibleRef(!hideCheckbox.checked);
        });
        setVisibleRef(!hideCheckbox.checked);
    }

    redraw();

    return {
        getValue: function() {
            return getValueRef();
        },
        setValue: function(newValue) {
            setValueRef(newValue);
            redraw();
            return this;
        },
        getAnimate: function() {
            return getAnimateRef();
        },
        setAnimate: function(shouldAnimate) {
            setAnimateRef(!!shouldAnimate);
            return this;
        },
        getVisible: function() {
            return getVisibleRef();
        },
        setVisible: function(shouldShow) {
            setVisibleRef(!!shouldShow);
            return this;
        },
        getState: function() {
            return {
                value: this.getValue(),
                animate: this.getAnimate(),
                visible: this.getVisible()
            };
        },
        setState: function(state) {
            if (state.value !== undefined) this.setValue(state.value);
            if (state.animate !== undefined) this.setAnimate(state.animate);
            if (state.visible !== undefined) this.setVisible(state.visible);
            return this;
        }
    };
}

function initProgressBar(config) {
    const api = createProgressBar(config);
    if (api) {
        window.ProgressBar = api;
        if (!window.ProgressBarList) window.ProgressBarList = [];
        window.ProgressBarList.push(api);
    }
    return api;
}

if (typeof window !== 'undefined') {
    window.createProgressBar = createProgressBar;
    window.initProgressBar = initProgressBar;
    window.ProgressBarList = [];

    function autoInit() {
        let roots = document.querySelectorAll('.progress-widget');
        if (roots.length === 0) {
            const byId = document.getElementById('progress');
            if (byId) roots = [byId];
        }
        for (let i = 0; i < roots.length; i++) {
            initProgressBar({ root: roots[i] });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoInit);
    } else {
        autoInit();
    }
}
