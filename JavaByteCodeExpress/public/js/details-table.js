jui.ready([ "grid.table" ], function(table) {
    detailsTable = table("#details-table", {
        event: {
            expand: function (row, e) {
                $(row.list[0]).html("<i class='icon-right'></i>");
            },
            expandend: function (row, e) {
                $(row.list[0]).html("<i class='icon-left'></i>");
            }
        },
        expand: true,
        animate: true
    });
});