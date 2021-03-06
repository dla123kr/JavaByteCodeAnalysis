jui.ready(["ui.notify"], function (notify) {
    notification = notify("body", {
        position: "bottom-left",
        showDuration: 1000,
        hideDuration: 1000,
        tpl: {
            item: $("#notification_tpl").html()
        }
    });

    notify_submit = function (type, msg) {
        notification.add({
            type: type,
            message: msg
        });
    }
});
