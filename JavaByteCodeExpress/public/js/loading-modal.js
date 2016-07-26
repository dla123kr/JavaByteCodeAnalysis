jui.ready(["ui.modal"], function (modal) {
    $("#loading_modal").appendTo("body");

    loadingModal = modal("#loading_modal", {
       color: "black"
    });

    loadingModal.show();
});