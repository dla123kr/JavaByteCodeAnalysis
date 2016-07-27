jui.ready(["grid.table"], function (table) {
    detailsTable = table("#details_table", {
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
                    if(this.getExpand() != null && this.getExpand().index == row.index)
                        this.hideExpand(row.index);
                    else
                        this.showExpand(row.index);
                } else if (row.data.type == "Package") {
                    var treeIndex = packageTree.activeIndex();
                    var index = "";
                    if (treeIndex == null || treeIndex == undefined) {
                        index = row.index;
                    } else {
                        var packIndex = -1;

                        for (var i = 0; i <= row.index; i++) {
                            if (this.get(i).data.type == "Package") {
                                packIndex++;
                            }
                        }

                        index = treeIndex + "." + packIndex;
                        console.log(index);
                    }

                    var node = packageTree.get(index);

                    // 해당 패키지 하위에 더 패키지가 있다면 + 오픈
                    if (node.children.length > 0 && node.children[0].data.name == "#dump")
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
            if (nodes == loadedData) {
                nodes = nodes[splitted[i]];
            }
            else {
                nodes = nodes.packages[splitted[i]];
            }
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

        // loadedData에는 (default)와 각종 Package들이 있음
        for (var i = 0; i < loadedData.length; i++) {
            var node = loadedData[i];

            packageTree.append({isLoaded: true, type: "Package", name: node.name});

            // (default)와 각종 Package안에 추가로 패키지가 있다면, #dump를 추가해서 +버튼을 만들자
            if (node.packages.length > 0)
                packageTree.append(i, {isLoaded: true, type: "Class", name: "#dump"});
        }

        packageTree.foldAll();
        packageTree.open();
        packageTree.select(null);

        detailsTable.update(loadedData);
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