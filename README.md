# ProgressBar

Небольшой виджет — круговой прогресс от 0 до 100%, рисуется на Canvas. Есть поле для ввода значения и две галочки: крутить круг и скрывать его. Никакой сборки, просто подключить стили и скрипт.

Стили завязаны на класс `.progress-widget`, так что в чужом проекте ничего не поломается. И API сделал так, чтобы не зависеть от разметки: можно передать в конфиг свои функции get/set для значения, анимации и видимости — тогда виджет вообще не лезет в ваш DOM, кроме как рисует в контейнер для canvas.

---

Как запустить: открыть `index.html` в браузере. В поле Value ввести число от 0 до 100 — круг заполняется. Animate включает вращение, Hide прячет виджет.

Если на странице есть блок с классом `.progress-widget` или с `id="progress"`, виджет подхватится сам. Либо вызвать вручную:

```javascript
const api = createProgressBar({ root: document.getElementById('progress') });
```

Можно вообще без нашей разметки — только дать контейнер, куда рисовать, и колбэки, откуда брать значение и куда отдавать состояние анимации/видимости:

```javascript
const api = createProgressBar({
    bar: document.getElementById('bar'),
    getValue: () => state.value,
    setValue: (v) => { state.value = v; },
    getAnimate: () => state.animate,
    setAnimate: (on) => { state.animate = on; /* сам решаешь, как отрисовать */ },
    getVisible: () => state.visible,
    setVisible: (on) => { state.visible = on; },
    size: 160
});
```

В конфиге можно передать либо элементы (`valueInput`, `bar`, `animateCheckbox`, `hideCheckbox`), либо эти пары функций — как удобнее. Ещё есть `selectors` (если ищите по своему разметку внутри root), `animatedClass` (по умолчанию `form-bar--animated`), `size`, `lineWidth`, `rotate`. Обязательно нужен контейнер `bar` и источник значения: либо инпут `valueInput`, либо getValue + setValue.

---

У возвращаемого объекта методы: getValue/setValue, getAnimate/setAnimate, getVisible/setVisible, getState/setState. Set-методы возвращают this, можно цепочкой. После автоинициализации последний инстанс лежит в `window.ProgressBar`, все — в `window.ProgressBarList`.

Чтобы встроить в другой проект: подключите style.css и script.js. Либо скопировать разметку с классами progress-widget, form-bar, id value и чекбоксов (селекторы при необходимости переопределяешь в config.selectors). Либо не копировать — только один div под canvas и колбэки, как в примере выше. Несколько виджетов на одной странице ок, все API в ProgressBarList.

Вёрстка адаптивная: в портрете блок 320×568, круг сверху; в альбоме — 568×320, круг слева, контролы справа; на широком экране карточка 320px по центру.
