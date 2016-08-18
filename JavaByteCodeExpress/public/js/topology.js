var prevTopologyOption = {
    relation: "Both",
    detail: "Methods",
    depth: 1
};
var presentTopologyOption = {
    relation: "Both",
    detail: "Methods",
    depth: 1
};

jui.ready(["ui.dropdown", "ui.slider"], function (dropdown, slider) {
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
});

jui.ready(null, function () {
    var chart = jui.include("chart.builder");
    chartWidth = 1150, chartHeight = 700;

    $('#topology').bind('mousewheel DOMMouseScroll', function (e) {
        return false;
    });

    function rnd(count) {
        return Math.floor(Math.random() * count);
    }

    jui.define("topology.custom.sort", [], function () {
        return function (data, area, space) {
            var xy = [];

            /**
             * depth, ingoing에 따라 위치 조절하자
             */
            var onlyIngoing = [];
            var depthData = [[], [], [], [], [], []];
            var centerIdx;
            for (var i = 0; i < data.length; i++) {
                if (data[i].isOnlyIngoing && data[i].type != "main_class" && data[i].type != "main_method")
                    onlyIngoing.push(data[i]);
                else if (!data[i].isOnlyIngoing && data[i].type != "main_class" && data[i].type != "main_method") {
                    depthData[data[i].depth].push(data[i]);
                }

                if (data[i].type == "main_class" || data[i].type == "main_method")
                    centerIdx = i;
            }

            var MAX_WIDTH = chartWidth - 100;
            var MAX_COUNT = 16;
            var FLOOR_GAP = 100;

            var MAX_INGOING_ROW = onlyIngoing.length % MAX_COUNT == 0 ? onlyIngoing.length / MAX_COUNT : Math.floor(onlyIngoing.length / MAX_COUNT) + 1;
            var INIT_INGOING_Y = 50;
            for (var i = 0; i < onlyIngoing.length; i++) {
                // var row = i % MAX_COUNT == 0 ? i / MAX_COUNT : Math.floor(i / MAX_COUNT) + 1; // 1 ~ n
                var row = Math.floor(i / MAX_COUNT) + 1;
                var col = i % MAX_COUNT; // 0 ~ 19
                if (row != MAX_INGOING_ROW) {
                    onlyIngoing[i].x = MAX_WIDTH / MAX_COUNT * (col + 1);
                } else {
                    onlyIngoing[i].x = MAX_WIDTH / ((onlyIngoing.length % (MAX_COUNT + 1)) + 2) * (col + 1);
                }
                onlyIngoing[i].y = col % 2 == 0 ? INIT_INGOING_Y + (row - 1) * FLOOR_GAP : INIT_INGOING_Y + FLOOR_GAP / 2 + (row - 1) * FLOOR_GAP;
            }
            // centerIdx 조작
            data[centerIdx].y = 50 + MAX_INGOING_ROW * FLOOR_GAP + 200;

            var INIT_OUTGOING_Y = data[centerIdx].y + 200;
            for (var k = 1; k <= 5; k++) {
                var MAX_OUTGOING_ROW = depthData[k].length % MAX_COUNT == 0 ? depthData[k].length / MAX_COUNT : Math.floor(depthData[k].length / MAX_COUNT) + 1;
                for (var i = 0; i < depthData[k].length; i++) {
                    var row = Math.floor(i / MAX_COUNT) + 1;
                    var col = i % MAX_COUNT;
                    if (row != MAX_OUTGOING_ROW) {
                        depthData[k][i].x = MAX_WIDTH / MAX_COUNT * (col + 1);
                    } else {
                        depthData[k][i].x = MAX_WIDTH / ((depthData[k].length % (MAX_COUNT + 1)) + 2) * (col + 1);
                    }
                    depthData[k][i].y = col % 2 == 0 ? INIT_OUTGOING_Y + (row - 1) * FLOOR_GAP : INIT_OUTGOING_Y + FLOOR_GAP / 2 + (row - 1) * FLOOR_GAP;
                    if (depthData[k][i].x > 1200) {
                        console.log("================================");
                        console.log("depthData[" + k + "][" + i + "].x: " + depthData[k][i].x);
                        console.log(depthData[k].length);
                        console.log(col);

                    }
                }
                INIT_OUTGOING_Y += MAX_OUTGOING_ROW * FLOOR_GAP + 200;
            }

            for (var i = 0; i < data.length; i++) {
                xy.push({x: data[i].x, y: data[i].y});
            }

            return xy;
        }
    });

    var tpl_tooltip =
        '<div id="topology_tooltip" class="popover popover-top">' +
        '<div class="head"><!= longName !></div>' +
        '<div class="body">' +
        '<div><!= comment !></div>' +
        '</div>' +
        '</div>';

    var isDragging = false;

    function showTopologyTooltip(topology, obj, e) {
        var title;
        if (obj.data.type == "package")
            title = '<i class="icon-document"></i> ';
        else if (obj.data.type == "class" || obj.data.type == "main_class")
            title = '<i class="icon-script"></i> ';
        else
            title = '<i class="icon-message"></i> ';

        var comment = "Double Click 시 해당 요소 중심으로 봅니다.";
        if (obj.data.type == "main_class" || obj.data.type == "package")
            comment = "";
        else if (obj.data.type == "main_method")
            comment = "Double Click 시 이 Method를 선언한 Class 중심으로 봅니다.";

        var $tooltip = $(topology.tpl.tooltip({
            longName: title + obj.data.longName,
            comment: comment
        }));
        $("body").append($tooltip);

        $tooltip.css({
            "z-index": 10000,
            left: e.pageX - $tooltip.width() / 2,
            top: e.pageY - $tooltip.height() - 30
        });
    }

    initTopology = function (data, centerIdx) {
        if (data == null)
            data = [];
        leaveHistory();
        $("#topology").empty();

        var centerKey = data[centerIdx].key;
        data[centerIdx].x = chartWidth / 2;
        data[centerIdx].y = 0;

        setTopologySize(data);

        topologyChart = chart("#topology", {
            width: chartWidth,
            height: chartHeight,
            padding: 5,
            axis: {
                c: {
                    type: "topologytable",
                    sort: "topology.custom.sort"
                },
                data: data
            },
            brush: {
                type: "topologynode2",
                nodeImage: function (data) {
                    if (data.type == "main_class") {
                        return "/images/main_class.png";
                    } else if (data.type == "main_package") {
                        return "images/main_package.png";
                    } else if (data.type == "main_method") {
                        return "images/main_method.png";
                    } else if (data.type == "public") {
                        return "/images/public.png";
                    } else if (data.type == "protected") {
                        return "/images/protected.png";
                    } else if (data.type == "private") {
                        return "/images/private.png";
                    } else if (data.type == "class") {
                        return "/images/class.png";
                    } else if (data.type == "package") {
                        return "/images/package.png";
                    } else if (data.type == "unknown") {
                        return "/images/unknown.png";
                    } else if (data.type == "default") {
                        return "/images/default.png";
                    }
                },
                nodeTitle: function (data) {
                    var name = data.name;
                    if (data.type != "main_class" && data.type != "package" && data.type != "class") {
                        var splt = data.key.split('.');
                        if (splt.length > 1)
                            name = splt[splt.length - 2] + "." + name;
                    }
                    return name;
                },
                nodeScale: function (data) {
                    if (data.type == "main_package")
                        return 2.3;
                    else if (data.type == "main_class" || data.type == "main_method")
                        return 2;
                    else if (data.type == "unknown")
                        return 0.6;
                    else if (data.type == "class")
                        return 1;
                    else if (data.type == "package")
                        return 1.2;
                    else
                        return 0.8;
                },
                activeNode: centerKey
            },
            tpl: {
                tooltip: tpl_tooltip
            },
            event: {
                mouseover: function (obj, e) {
                    $("#topology_tooltip").remove();
                    if (!isDragging) {
                        showTopologyTooltip(this, obj, e);
                    }
                },
                mousedown: function (obj, e) {
                    $("#topology_tooltip").remove();
                    isDragging = true;
                },
                mouseup: function (obj, e) {
                    isDragging = false;
                    showTopologyTooltip(this, obj, e);
                },
                mouseout: function (obj, e) {
                    $("#topology_tooltip").remove();
                },
                dblclick: function (obj, e) {
                    if (obj.data.type != "package" && obj.data.type != "main_class" && obj.data.type != "main_method")
                        loadTopology(obj.data.key, null);
                    else if (obj.data.type == "main_method") {
                        var splt = obj.data.key.split('.');
                        if (splt.length == 1)
                            return;

                        var key = obj.data.key.substring(0, obj.data.key.length - (splt[splt.length - 1].length + 1));
                        loadTopology(key, null);
                    }
                }
            },
            widget: {
                type: "topologyctrl",
                zoom: true,
                move: true // 토폴로지 덩어리를 옮길 수 있게 할 것인가?
            },
            style: {
                topologyNodeRadius: 15 // 이미지 크기
            }
        });
    }

    loadTopology = function (name, option) {
        if (name == null) {
            var data = topologyChart.axis(0).data;
            for (var i = 0; i < data.length; i++) {
                if (data[i].type == "main_class" || data[i].type == "main_method") {
                    name = data[i].key;
                    break;
                }
            }
        }

        var relation = presentTopologyOption.relation = option == null ? $("#relation_content").html().trim().split(' ')[0] : option.relation;
        var detail = presentTopologyOption.detail = option == null ? $("#detail_content").html().trim().split(' ')[0] : option.detail;
        var depth = presentTopologyOption.depth = option == null ? depthSlider.getFromValue() : option.depth;
        console.log(relation);
        console.log(detail);
        console.log(depth);

        topologyLoading.show();
        remoteController.topologyLoadingAtRC.show();

        name = name.replace("#", "*");
        var type = "Class";
        if (name.split('*').length > 1)
            type = "Method";
        $.ajax({
            url: "http://192.168.0.204:8080/viewTopology?hash=" + hash + "&name=" + name + "&type=" + type + "&relation=" + relation + "&detail=" + detail + "&depth=" + depth,
            type: "GET",
            success: function (result) {
                console.log("loadTopology 성공");
                name = name.replace("*", "#");
                var idx;
                for (idx = 0; idx < result.length; idx++) {
                    if (result[idx].key == name)
                        break;
                }

                initTopology(result, idx);
                initFilterTree(null, result, idx);
            },
            error: function () {
                console.log("viewTopology 에러");
                initTopology(null, null);
                initFilterTree(null, null, null);
            },
            complete: function () {
                topologyLoading.hide();
                remoteController.topologyLoadingAtRC.hide();
            }
        });
    }
});

var histories = [];
function leaveHistory() {
    if ($("#topology_div").css('display') == 'none')
        return;

    var data = topologyChart.axis(0).data;
    var mainData;
    for (var i = 0; i < data.length; i++) {
        if (data[i].type == "main_class" || data[i].type == "main_method") {
            mainData = data[i];
            break;
        }
    }
    var history = {
        key: mainData.key,
        type: mainData.type,
        relation: prevTopologyOption.relation,
        detail: prevTopologyOption.detail,
        depth: prevTopologyOption.depth
    };
    prevTopologyOption = {
        relation: presentTopologyOption.relation,
        detail:  presentTopologyOption.detail,
        depth:  presentTopologyOption.depth
    };

    if (histories.length == 5) {
        // 맨 처음꺼 없앤다.
        // histories에서도 없애야하고, a태그도 없애야함
        histories.splice(0, 1);
        $("#history_span")[0].getElementsByTagName('a')[0].remove();
    }
    histories.push(history);
    var splt = history.key.split('.');
    var icon = "<i class='";
    if (history.type == "main_class")
        icon += "icon-script";
    else if (history.type == "main_method")
        icon += "icon-message";
    icon += "'></i>";
    var name = splt[splt.length - 1];
    if (name.length > 20)
        name = name.substring(0, 20) + "..";
    var aTag = "<a class='btn small' style='width: 180px; overflow: hidden; margin-right: 5px;' onclick='loadHistory(this)' onmouseover='showHistoryTooltip(this, event)' onmouseout='hideHistoryTooltip()'>" + icon + " " + name + "</a>";
    $("#history_span").append(aTag);
}

function clearHistory() {
    histories = [];
    $("#history_span")[0].innerHTML = '';
}

function loadHistory(obj) {
    var aTags = $("#history_span")[0].getElementsByTagName('a');
    for (var i = 0; i < aTags.length; i++) {
        if (aTags[i] == obj) {
            loadTopology(histories[i].key, histories[i]);
            break;
        }
    }
}

function showHistoryTooltip(obj, e) {
    e.preventDefault();

    var $tooltip = $("#history_tooltip");
    var head = $tooltip[0].getElementsByClassName('head')[0];
    var body = $tooltip[0].getElementsByClassName('body')[0];

    var aTags = $("#history_span")[0].getElementsByTagName('a');
    for (var i = 0; i < aTags.length; i++) {
        if (aTags[i] == obj) {
            var icon = "<i class='";
            var type;
            if (histories[i].type == "main_class") {
                icon += "icon-script";
                type = "Class";
            } else if (histories[i].type == "main_method") {
                icon += "icon-message";
                type = "Method";
            }
            icon += "'></i>";
            head.innerHTML = icon + " " + histories[i].key;
            body.innerHTML =
                "<table class='table classic hover' style='width: 150px;'>" +
                "<thead><tr><th style='width: 50px;'></th><th></th></tr></thead>" +
                "<tbody>" +
                "<tr><td style='font-weight: bold;'>Type</td><td>" + type + "</td></tr>" +
                "<tr><td style='font-weight: bold;'>Relation</td><td>" + histories[i].relation + "</td></tr>" +
                "<tr><td style='font-weight: bold;'>Detail</td><td>" + histories[i].detail + "</td></tr>" +
                "<tr><td style='font-weight: bold;'>Depth</td><td>" + histories[i].depth + "</td></tr>" +
                "</tbody></table>";
            break;
        }
    }

    $tooltip.css({
        "display": 'block',
        left: e.pageX - 50,
        top: e.pageY + 20
    });
}

function hideHistoryTooltip() {
    $("#history_tooltip").css('display', 'none');
}

function setTopologySize(data) {
    var onlyIngoingCount = 0;
    var depthCount = [0, 0, 0, 0, 0, 0];

    for (var i = 0; i < data.length; i++) {
        if (data[i].type == "main_class" || data[i].type == "main_method")
            continue;

        if (data[i].isOnlyIngoing) {
            onlyIngoingCount++;
        } else {
            depthCount[data[i].depth]++;
        }
    }

    var MAX_COUNT = 20;
    var MAX_INGOING_ROW = onlyIngoingCount % MAX_COUNT == 0 ? onlyIngoingCount / MAX_COUNT : Math.floor(onlyIngoingCount / MAX_COUNT) + 1;
    var FLOOR_GAP = 100;

    var MAX_DEPTH = depthSlider.getFromValue();
    if (isNaN(MAX_DEPTH))
        MAX_DEPTH = 1;
    var height = MAX_INGOING_ROW * FLOOR_GAP + 500;
    for (var i = 1; i <= MAX_DEPTH; i++) {
        var MAX_OUTGOING_ROW = depthCount[i].length % MAX_COUNT == 0 ? depthCount[i] / MAX_COUNT : Math.floor(depthCount[i] / MAX_COUNT) + 1;
        if (MAX_OUTGOING_ROW > 0)
            height += MAX_OUTGOING_ROW * FLOOR_GAP + 200;
    }

    chartHeight = height;
    $("#topology").css('height', chartHeight);
    $("#topology_body").css('height', chartHeight + 20);
    $("#topology_msgbox").css('height', chartHeight + 170);
}

function recursiveConstructFilterTree(key, oriKey, subKey, treeIndex, type) {
    /**
     * type이 Methods면 key가 길다
     * type이 Packages면 Package까지밖에 표현 못 한다.
     * type이 Classes || Methods면 Class까지 표현할 수 있따.
     *
     * treeIndex가 null이면 잘 처리해줘야 한다
     * key의 splt.length가 1(type에 따라 달라짐)이면 ..
     */
    var splt = key.split('.');
    var endLength;
    if (type == "Packages" || type == "Classes") {
        // splt.length == 1이면 끝 // 패키지1 혹은 클래스1
        endLength = 1;
    } else if (type == "Methods") {
        // splt.length == 2이면 끝 // 클래스1.메소드1
        endLength = 2;
    }

    if (splt.length == endLength) {
        if (type == "Packages") {
            type = "Package";
        } else if (type == "Classes") {
            type = "Class";
        } else {
            // 클래스가 이미 있을 수도 있다.
            // 그러므로 찾아보고 없으면 append하자
            // 어디서? -> treeIndex의 자식들 중에서 splt[0]이 없으면 추가
            var node = filterTree.uit.getNode(treeIndex);
            for (var i = 0; i < node.children.length; i++) {
                if (node.children[i].data.name == splt[0]) {
                    return;
                }
            }

            type = "Class";
            var spltOriKey = oriKey.split('.');
            oriKey = oriKey.substring(0, oriKey.length - (spltOriKey[spltOriKey.length - 1].length + 1));
        }
        filterTree.append(treeIndex, {checked: true, type: type, name: splt[0], longName: oriKey});
    } else {
        var nodes, idx;
        if (treeIndex == null) {
            nodes = filterTree.uit.getNode(null);
        } else {
            nodes = filterTree.uit.getNode(treeIndex).children;
        }
        for (idx = 0; idx < nodes.length; idx++) {
            if (nodes[idx].data.name == splt[0]) {
                break;
            }
        }
        // 못 찾음
        subKey = subKey != "" ? subKey + "." + splt[0] : splt[0];
        if (idx == nodes.length) {
            filterTree.append(treeIndex, {checked: true, type: "Package", name: splt[0], longName: subKey});
        }
        if (treeIndex != null) {
            idx = treeIndex + "." + idx;
        }
        recursiveConstructFilterTree(key.substring(splt[0].length + 1, key.length), oriKey, subKey, idx, type);
    }
}

originTopologyData = null;
originTopologyMainIndex = null;
initFilterTree = function (btn, data, main_idx) {
    var filter = $("#filter");
    // 둘 중 하나는 null이다.
    // data가 null이면, 창 온오프
    // btn이 null이면 그리기

    if (data != null) {
        originTopologyData = data;
        originTopologyMainIndex = main_idx;

        $("#filter_tree").html("");
        filterTree = jui.create("ui.tree", "#filter_tree", {
            root: {checked: true, type: "Package", name: data[main_idx].longName, longName: data[main_idx].longName}
        });
        filterTree.append({checked: true, type: "Package", name: "(default)", longName: "(default)"});

        console.log(data);
        var type = $("#detail_content").text().trim();
        console.log(type);
        for (var i = 0; i < data.length; i++) {
            if (main_idx == i) continue;
            var startIdx = null;
            var splt = data[i].key.split('.');
            if ((type == "Classes" && splt.length == 1) || (type == "Methods" && splt.length == 2)) {
                startIdx = "0";
            }
            recursiveConstructFilterTree(data[i].key, data[i].key, "", startIdx, type);
        }
    }

    if (btn != null) {
        if (filter.css('display') == 'none') {
            var x = btn.offsetLeft, y = btn.offsetTop;
            filter.css('top', y + 35);
            filter.css('left', x - 450);

            filter.show();
        }
        else {
            filter.hide();
        }
    } else {
        filter.hide();
    }
}

function recursiveCheckChanged(node, chk) {
    node.data.checked = chk;
    for (var i = 0; i < node.children.length; i++) {
        recursiveCheckChanged(node.children[i], chk);
    }
}

function checkChanged(chkbox) {
    var items = chkbox.parentElement.parentElement.getElementsByTagName("li");
    for (var i = 0; i < items.length; i++) {
        var childChkbox = items[i].getElementsByTagName("input")[0];
        childChkbox.checked = chkbox.checked;
    }

    var longName = chkbox.parentElement.innerText.trim();
    var parent = chkbox.parentElement.parentElement.parentElement; // ul
    while (parent != $("#filter_tree")[0]) {
        var parentName = parent.parentElement.getElementsByTagName("div")[0].innerText.trim();
        if (parentName != "(default)") {
            longName = parentName + "." + longName;
        }
        parent = parent.parentElement.parentElement;
    }

    if (longName == filterTree.uit.getRoot().data.name) {
        var nodes = filterTree.uit.getNodeAll();
        filterTree.uit.getRoot().data.checked = chkbox.checked;
        for (var i = 0; i < nodes.length; i++) {
            nodes[i].data.checked = chkbox.checked;
        }
    } else {
        var splt = longName.split('.');
        longName = longName.replace(filterTree.uit.getRoot().data.name + ".", "");

        // 노드 찾아야돼 !
        var findedNode = null;
        var nodes = filterTree.uit.getNodeAll();
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].data.longName == longName) {
                findedNode = nodes[i];
                break;
            }
        }
        if (findedNode == null) {
            console.log(longName);
        }
        recursiveCheckChanged(findedNode, chkbox.checked);
    }
}

function clearFilterTree() {
    var items = $("#filter_tree")[0].getElementsByTagName("li");
    for (var i = 0; i < items.length; i++) {
        var childChkbox = items[i].getElementsByTagName("input")[0];
        childChkbox.checked = true;
    }

    var nodes = filterTree.uit.getNodeAll();
    filterTree.uit.getRoot().data.checked = true;
    for (var i = 0; i < nodes.length; i++) {
        nodes[i].data.checked = true;
    }

    initTopology(originTopologyData, originTopologyMainIndex);
}

function applyFilterTree() {
    var cpyTopologyData = [];
    for (var i = 0; i < originTopologyData.length; i++) {
        cpyTopologyData.push(originTopologyData[i]);
    }

    // key, name, longName, type, x, y, outgoing

    var unchkList = [];
    var nodes = filterTree.uit.getNodeAll();

    var type = $("#detail_content").text().trim();
    var chkType = type == "Packages" ? "Package" : "Class";

    for (var i = 0; i < nodes.length; i++) {
        if (!nodes[i].data.checked && nodes[i].data.type == chkType) {
            unchkList.push(nodes[i].data.longName);
        }
    }

    for (var i = 0; i < cpyTopologyData.length; i++) {
        for (var j = 0; j < unchkList.length; j++) {
            var key = cpyTopologyData[i].key;
            if (type == "Methods") {
                var splt = key.split('.');
                key = key.substring(0, key.length - (splt[splt.length - 1].length + 1));
            }
            if (key == unchkList[j]) {
                cpyTopologyData.splice(i, 1);
                i--;
                break;
            }
        }
    }

    // outgoing에 남은 찌꺼기 제거
    for (var i = 0; i < cpyTopologyData.length; i++) {
        for (var j = 0; j < cpyTopologyData[i].outgoing.length; j++) {
            for (var k = 0; k < unchkList.length; k++) {
                var opposite = cpyTopologyData[i].outgoing[j];
                if (type == "Methods") {
                    var splt = opposite.split('.');
                    opposite = opposite.substring(0, opposite.length - (splt[splt.length - 1].length + 1));
                }
                if (opposite == unchkList[k]) {
                    cpyTopologyData[i].outgoing.splice(j, 1);
                    j--;
                    break;
                }
            }
        }
    }

    for (var i = 0; i < cpyTopologyData.length; i++) {
        for (var j = 0; j < unchkList.length; j++) {
            var key = cpyTopologyData[i].key;
            var splt = key.split('.');
            if (type == "Methods") {
                key = key.substring(0, key.length - (splt[splt.length - 1].length + 1));
            }

        }
    }

    for (var i = 0; i < cpyTopologyData.length; i++) {
        if (cpyTopologyData[i].type == "main_class" || cpyTopologyData[i].type == "main_method") {
            initTopology(cpyTopologyData, i);
            break;
        }
    }
}