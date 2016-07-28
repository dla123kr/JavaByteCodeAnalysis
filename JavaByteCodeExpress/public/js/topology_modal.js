jui.ready(["ui.modal"], function (modal) {
    $("#topology_modal").appendTo("body");

    topologyModal = modal("#topology_modal", {
        color: "black"
    });

    oriTopologyModalHeight = null;
    
    $(window).scroll(function() {
        $("#topology_modal").css("top", oriTopologyModalHeight + $(document).scrollTop());
    });
});