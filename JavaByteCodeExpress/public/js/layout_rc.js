jui.ready(["ui.layout"], function (layout) {
    layoutRC = layout("#layout_rc", {
        width: "auto",
        height: 765,
        left: {
            size: 200,
            min: 200,
            max: 500,
            resize: true
        }
    });
});