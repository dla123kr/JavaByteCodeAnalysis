jui.ready(["grid.table"], function (table) {
    detailsTable = table("#details-table", {
        event: {
            expand: function (row, e) {
                $(row.list[0]).html("<i class='icon-right'></i>");
            },
            expandend: function (row, e) {
                if (row == null)
                    return;
                if (row.data.type == "Class")
                    $(row.list[0]).html("<i class='icon-left'></i>");
            },
            click: function (row, e) {
                if (row.data.type == "Class") {
                    this.showExpand(row.index);
                } else if (row.data.type == "Package") {
                    var treeIndex = packageTree.activeIndex();
                    var index = "";
                    if (treeIndex == null || treeIndex == undefined) {
                        index = row.index;
                    } else {
                        index = treeIndex + "." + row.index;
                    }

                    var node = packageTree.get(index);

                    if (node.children[0].data.name == "#dump")
                        packageTree.open(node.index);

                    // 테이블 업데이트 ?
                    var datas = filterNode(node.index);
                    this.update(datas);

                    packageTree.select(node.index);
                }
            }
        },
        expand: true,
        expandEvent: false,
        animate: true
    });

    function filterNode(index) {
        var splitted = index.split('.');
        var nodes = loadedData;
        for (var i = 0; i < splitted.length; i++) {
            if (nodes == loadedData)
                nodes = nodes[splitted[i]];
            else
                nodes = nodes.children[splitted[i]];
        }

        var ret = [];

        for (var i = 0; i < nodes.children.length; i++) {
            var node = nodes.children[i];

            if (node.type == "Package" || node.type == "Class") {
                ret.push(node);
            }
        }

        return ret;
    }

    $("#btn-home").click(function () {
        packageTree.uit.removeNodes();

        for (var i = 0; i < loadedData.length; i++) {
            var node = loadedData[i];

            packageTree.append({isLoaded: true, type: "Package", name: node.name});
            packageTree.append(i, {isLoaded: true, type: "Class", name: "#dump"});
        }

        packageTree.foldAll();
        packageTree.open();
        packageTree.select(null);

        detailsTable.update(loadedData);
        return;
    });

    $("#btn-up").click(function () {
        var treeIndex = packageTree.activeIndex();
        if (treeIndex == null || treeIndex == undefined)
            return;

        var splitted = treeIndex.split('.');
        if (splitted.length == 1)
            $("#btn-home").trigger('click');
        else {
            var suffix = splitted[splitted.length - 1];
            var index = treeIndex.substring(0, treeIndex.length - suffix.length - 1);

            console.log(index);
            var node = packageTree.get(index);
            var datas = filterNode(node.index);
            detailsTable.update(datas);

            packageTree.select(node.index);
        }
    });
});