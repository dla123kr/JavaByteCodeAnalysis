var dd;

jui.ready(["ui.dropdown", "grid.table"], function (dropdown, table) {

    dd = dropdown("#details_table_dd", {
        event: {
            change: function (data) {
                if (data.text == "View Topology") {
                    // 토폴로지 조종
                    // loading modal 양쪽 다 띄워야함
                    window.opener.topologyLoading.show();
                    topologyLoadingAtRC.show();

                    // ajax로 데이터 요청

                    var name = $("#selected_name").text().trim().replace("#", "*");
                    var type = "Class";
                    if (name.split('*').length > 1)
                        type = "Method";
                    $.ajax({
                        url: "http://192.168.0.204:8080/viewTopology?hash=" + hash + "&name=" + name + "&type=" + type + "&relation=Both&detail=Classes&depth=1",
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

                            window.opener.initTopology(result, idx);
                            window.opener.initFilterTree(null, result, idx);

                            window.opener.$("#topology_div").css('visibility', 'visible');
                        },
                        error: function () {
                            console.log("viewTopology 에러");
                            window.opener.initTopology(null, null);
                            window.opener.initFilterTree(null, null, null);
                        },
                        complete: function () {
                            window.opener.topologyLoading.hide();
                            topologyLoadingAtRC.hide();
                        }
                    });
                }
            }
        }
    });

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
                    if (this.getExpand() != null && this.getExpand().index == row.index)
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
            },
            rowmenu: function (row, e) {
                var icon;
                if (row.data.type == "Package")
                    icon = "<i class='icon-document'></i> "
                else if (row.data.type == "Class")
                    icon = "<i class='icon-script'></i> "

                this.select(row.index);
                $("#selected_name").html(icon + row.data.longName);
                dd.move(e.pageX, e.pageY);
                dd.show();
            }
        },
        expand: true,
        expandEvent: false,
        animate: true
    });

});

methodRightClick = function (className, content, signature, e) {
    e.preventDefault();

    var icon = "<i class='icon-message'></i> ";
    var methodName = content.innerText;
    var longName = className + "." + methodName;

    $("#selected_name").html(icon + longName + "#" + signature);
    console.log(e);
    dd.move(e.pageX, e.pageY);
    dd.show();
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