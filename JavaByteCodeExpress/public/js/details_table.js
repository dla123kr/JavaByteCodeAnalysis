var isViewTopology = false;

jui.ready(["ui.dropdown", "grid.table"], function (dropdown, table) {

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
                if (this.activeIndex() != null)
                    this.unselect();

                if (row.data.type == "Class") {
                    if (!isViewTopology) {
                        if (this.getExpand() != null && this.getExpand().index == row.index)
                            this.hideExpand(row.index);
                        else
                            this.showExpand(row.index);
                    } else {
                        viewTopology(row.data.longName);
                        isViewTopology = false;
                    }
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

});

function viewTopologyClick() {
    isViewTopology = true;
}

function viewTopology(key) {
    window.opener.topologyLoading.show();
    topologyLoadingAtRC.show();

    var name = key.replace("#", "*");
    var type = "Class";
    if (name.split('*').length > 1)
        type = "Method";
    var relation = window.opener.$("#relation_content").html().trim().split(' ')[0];
    var detail = window.opener.$("#detail_content").html().trim().split(' ')[0];
    var depth = isNaN(window.opener.depthSlider.getFromValue()) ? 1 : window.opener.depthSlider.getFromValue();
    $.ajax({
        url: "http://192.168.0.172:8080/viewTopology?hash=" + hash + "&name=" + name + "&type=" + type + "&relation=" + relation + "&detail=" + detail + "&depth=" + depth,
        type: "GET",
        success: function (result) {
            console.log("viewTopology 성공");
            console.log(result);
            name = name.replace("*", "#");
            var idx;
            for (idx = 0; idx < result.length; idx++) {
                if (result[idx].key == name)
                    break;
            }

            window.opener.originTopologyData = result;
            window.opener.originTopologyMainIndex = idx;
            window.opener.initTopology(result, idx, true);
            window.opener.applyFilter(false);

            window.opener.$("#topology_div").css('display', 'block');
            window.opener.$("#help_div").css('display', 'none');
        },
        error: function () {
            console.log("viewTopology 에러");
            window.opener.initTopology(null, null, false);
        },
        complete: function () {
            window.opener.topologyLoading.hide();
            topologyLoadingAtRC.hide();
        }
    });
}

function toHome() {
    if (detailsTable.activeIndex() != null)
        detailsTable.unselect();

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
}

function toUp() {
    if (detailsTable.activeIndex() != null)
        detailsTable.unselect();

    var treeIndex = packageTree.activeIndex();
    if (treeIndex == null || treeIndex == undefined)
        return;

    var splitted = treeIndex.split('.');
    if (splitted.length == 1)
        $("#btn-home").trigger('click');
    else {
        var suffix = splitted[splitted.length - 1];
        var index = treeIndex.substring(0, treeIndex.length - suffix.length - 1);

        var node = packageTree.get(index);
        var datas = filterNode(node.index);
        detailsTable.update(datas);

        packageTree.select(node.index);
    }
}

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