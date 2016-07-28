jui.ready(["ui.modal"], function (modal) {
    $("#loading_modal").appendTo("body");

    loadingModal = modal("#loading_modal", {
        color: "black",
        autoHide: false
        
    });
    loadingModal.show();

    topologyLoadingModal = modal("#topology_loading_modal", {
        target: "#topology_modal",
        color: "white",
        autoHide: false
    });
});