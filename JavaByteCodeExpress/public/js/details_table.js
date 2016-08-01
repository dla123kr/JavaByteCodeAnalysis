jui.ready(["ui.dropdown", "ui.slider", "grid.table"], function (dropdown, slider, table) {

    var dd = dropdown("#details_table_dd", {
        event: {
            change: function (data) {
                if (data.text == "View Topology") {
                    // topologyModal 위치
                    topologyModal.show();
                    if (oriTopologyModalHeight == null)
                        oriTopologyModalHeight = parseInt($("#topology_modal").css("top"));
                    $("#topology_modal").css("top", oriTopologyModalHeight + $(document).scrollTop());
                    $("#topology_modal_body").height($("#topology_modal").height() - 65);


                    topologyLoadingModal.show();
                    // ajax로 데이터 요청
                    var name = ($("#selected_name").html()).split(' ')[2];
                    $.ajax({
                        url: "http://192.168.0.203:8080/viewTopology?hash=" + hash + "&name=" + name + "&relation=Both&detail=Classes&depth=1",
                        type: "GET",
                        success: function (result) {
                            console.log("viewTopology 성공");
                            var idx;
                            for (idx = 0; idx < result.length; idx++) {
                                if (result[idx].key == name)
                                    break;
                            }

                            result[idx] = {
                                key: result[idx].key,
                                longName: result[0].longName,
                                name: result[idx].name,
                                type: result[idx].type,
                                x: chartWidth / 2,
                                y: chartHeight / 2,
                                outgoing: result[idx].outgoing,
                                calledCount: result[idx].calledCount
                            };

                            initTopology(result);
                        },
                        error: function () {
                            console.log("viewTopology 에러");
                            initTopology(null);
                        },
                        complete: function () {
                            topologyLoadingModal.hide();
                        }
                    });
                }
            }
        }
    });

    relationDD = dropdown("#relation_dd", {
        event: {
            change: function (data) {
                $("#relation_content").html(data.text + " <i class='icon-arrow1'></i>");
            }
        }
    });

    depthSlider = slider("#depth_slider", {
        type: "single",
        orient: "horizontal",
        tooltip: false,
        from: 1,
        min: 1,
        max: 5,
        step: 1
    });

    detailDD = dropdown("#detail_dd", {
        event: {
            change: function (data) {
                $("#detail_content").html(data.text + " <i class='icon-arrow1'></i>");
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
                        initTopology();
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

    loadTopology = function () {
        var relation = $("#relation_content").html().trim().split(' ')[0];
        var detail = $("#detail_content").html().trim().split(' ')[0];
        console.log(relation);
        console.log(detail);
    }

    $("#btn-home").click(function () {
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
    });

    $("#btn-up").click(function () {
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
    });
});