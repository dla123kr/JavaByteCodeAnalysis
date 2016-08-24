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
filterList = [];
var originTopologyData = null;
var originTopologyMainIndex = null;

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

    topologyNodeDD = dropdown("#topology_node_dd", {
        event: {
            change: function (data) {
                alert("aaa");
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

        var comment = "Double Click 시 해당 요소 중심으로 봅니다.<br/>우클릭 시 부가기능이 나타납니다.";
        if (obj.data.type == "main_class" || obj.data.type == "package")
            comment = "";
        else if (obj.data.type == "main_method")
            comment = "Double Click 시 이 Method를 선언한 Class 중심으로 봅니다.";

        var $tooltip = $(topology.tpl.tooltip({
            longName: title + obj.data.key,
            comment: comment
        }));
        $("body").append($tooltip);

        $tooltip.css({
            "z-index": 10000,
            left: e.pageX - $tooltip.width() / 2,
            top: e.pageY - $tooltip.height() - 30
        });
    }

    initTopology = function (data, centerIdx, isLeaveHistory) {
        if (data == null)
            data = [];
        if (isLeaveHistory)
            leaveHistory();
        $("#topology").empty();

        var centerKey = data[centerIdx].key;
        data[centerIdx].x = chartWidth / 2;
        data[centerIdx].y = 0;

        setTopologySize(data);
        var maxCalledCount = 0;
        for (var i = 0; i < data.length; i++) {
            if (data[i].type == "main_class" || data[i].type == "main_method")
                continue;

            if (maxCalledCount < data[i].calledCount)
                maxCalledCount = data[i].calledCount;
        }


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
                    var scale;
                    if (data.type == "main_package" || data.type == "main_class" || data.type == "main_method")
                        return 2;
                    else if (data.type == "unknown")
                        scale = 0.6;
                    else if (data.type == "class")
                        scale = 1;
                    else if (data.type == "package")
                        scale = 1.2;
                    else
                        scale = 0.8;

                    if (data.calledCount > (maxCalledCount - 1) * 2 / 3 + 1)
                        scale *= 3;
                    else if (data.calledCount > (maxCalledCount - 1) / 3 + 1)
                        scale *= 2;

                    return scale;
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
                    if (e.button == 0) {
                        isDragging = true;
                    } else if (e.button == 2) {
                        if (obj.data.type == "main_class" || obj.data.type == "main_method")
                            return;

                        initTopologyNodeDD(obj);

                        var $topologyNodeDDList = $("#topology_node_dd_list");
                        $topologyNodeDDList.width('auto');
                        topologyNodeDD.move(e.pageX + 10, e.pageY + 10);
                        topologyNodeDD.show();
                        $topologyNodeDDList.width($topologyNodeDDList.width() + 70);
                    }
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
                },
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

        var relation = presentTopologyOption.relation = option == null ? $("#relation_content").text().trim().split(' ')[0] : option.relation;
        var detail = presentTopologyOption.detail = option == null ? $("#detail_content").text().trim().split(' ')[0] : option.detail;
        var depth = presentTopologyOption.depth = option == null ? depthSlider.getFromValue() : option.depth;
        console.log(presentTopologyOption);

        topologyLoading.show();
        remoteController.topologyLoadingAtRC.show();

        name = name.replace("#", "*");
        var type = "Class";
        if (name.split('*').length > 1)
            type = "Method";
        $.ajax({
            url: "http://localhost:8080/viewTopology?hash=" + hash + "&name=" + name + "&type=" + type + "&relation=" + relation + "&detail=" + detail + "&depth=" + depth,
            type: "GET",
            success: function (result) {
                console.log("loadTopology 성공");
                name = name.replace("*", "#");
                var idx;
                for (idx = 0; idx < result.length; idx++) {
                    if (result[idx].key == name)
                        break;
                }

                originTopologyData = result;
                originTopologyMainIndex = idx;
                initTopology(result, idx, true);
                applyFilter(false);
                //initFilterTree(null, result, idx);
            },
            error: function () {
                console.log("viewTopology 에러");
                initTopology(null, null, false);
                //initFilterTree(null, null, null);
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
        detail: presentTopologyOption.detail,
        depth: presentTopologyOption.depth
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

/**************************************************************************************************/

function initFilter() {
    $("#topology_node_dd").hide();

    var $filter = $("#filter");
    var $filterList = $("#filter_list");
    if ($filter.css('display') == 'none') {
        $filterList.html('');

        for (var i = 0; i < filterList.length; i++) {
            var icon = filterList[i].type == "package" ? "icon-document" : "icon-script";
            $filterList.append("<a style='cursor: default;'><span><i class='" + icon + "'></i> " + filterList[i].key + ".*</span><i class='icon-exit' style='cursor: pointer;' onclick='this.parentElement.remove();'></i></a>");
        }

        var x = $("#btn_filter")[0].offsetLeft, y = $("#btn_filter")[0].offsetTop;
        $filter.css('top', y + 35);
        $filter.css('left', x - 450);
        $filter.show();
    } else {
        $filter.hide();
    }
}

function initTopologyNodeDD(obj) {
    $("#filter").hide();

    var $list = $("#topology_node_dd_list");
    $list.html('');

    var key = obj.data.key;

    // 함수면 함수 잘라 내기
    var isMethod = false;
    if (obj.data.type != "package" && obj.data.type != "class") {
        var splt = key.split('.');
        key = key.substring(0, key.length - (splt[splt.length - 1].length + 1));

        isMethod = true;
    }

    // 클래스면 패키지로 잘라 내고, 패키지가 없으면 (default)로 변경
    if (obj.data.type == "class" || isMethod) {
        var splt = key.split('.');
        var type = "class";
        $list.append('<li onclick=addFilter("' + key + '","class")><i class="icon-script"></i> ' + key + '.* 을 필터</li>');

        if (splt.length == 1)
            key = "(default)";
        else
            key = key.substring(0, key.length - (splt[splt.length - 1].length + 1));
    }

    while (true) {
        var splt = key.split('.');
        $list.append('<li onclick=addFilter("' + key + '","package")><i class="icon-document"></i> ' + key + '.* 을 필터</li>');
        if (splt.length == 1)
            break;
        else
            key = key.substring(0, key.length - (splt[splt.length - 1].length + 1));
    }
}

function addFilter(key, type) {
    filterList.push({
        key: key,
        type: type
    });

    // 중복 제거
    filterList.sort(function (a, b) {
        return a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
    });
    for (var i = 1; i < filterList.length; i++) {
        if (filterList[i - 1].key == filterList[i].key && filterList[i - 1].type == filterList[i].type) {
            filterList.splice(i, 1);
            i--;
        }
    }

    applyFilter(false);

    topologyNodeDD.hide();
}

function applyFilter(isAccessWindow) {
    if (isAccessWindow) {
        filterList = [];
        var list = $("#filter_list")[0].getElementsByTagName('a');
        for (var i = 0; i < list.length; i++) {
            var type = list[i].getElementsByTagName('i')[0].className;
            var key = list[i].innerText.trim();
            key = key.substring(0, key.length - 2); // .* 제거

            filterList.push({
                key: key,
                type: type == "icon-document" ? "package" : "class"
            });
        }
    }

    var mainKey;
    // filterList를 통해 originTopologyData 걸러냄
    var cpyTopologyData = [];
    for (var i = 0; i < originTopologyData.length; i++) {
        var deepCopy = $.extend(true, {}, originTopologyData[i]);
        cpyTopologyData.push(deepCopy);
        if (originTopologyData[i].type == "main_method" || originTopologyData[i].type == "main_class")
            mainKey = originTopologyData[i].key;
    }

    console.log(cpyTopologyData);
    // 1. filterList의 key에 속하는 애들 다 없애자
    for (var i = 0; i < cpyTopologyData.length; i++) {
        if (cpyTopologyData[i].key == mainKey)
            continue;

        for (var j = 0; j < filterList.length; j++) {
            var key = cpyTopologyData[i].key;
            var splt = key.split('.');

            if (filterList[j].type == "package") {
                var packName;
                if (presentTopologyOption.detail == "Packages") {
                    packName = key;
                } else if (presentTopologyOption.detail == "Classes") {
                    if (splt.length == 1)
                        packName = "(default)";
                    else
                        packName = key.substring(0, key.length - (splt[splt.length - 1].length + 1));
                } else {
                    if (splt.length == 2)
                        packName = "(default)";
                    else
                        packName = key.substring(0, key.length - (splt[splt.length - 1].length + splt[splt.length - 2].length + 2));
                }

                if (packName.length >= filterList[j].key.length && packName.substring(0, filterList[j].key.length) == filterList[j].key) {
                    cpyTopologyData.splice(i, 1);
                    i--;
                    break;
                }
            } else if (filterList[j].type == "class" && presentTopologyOption.detail != "Packages") {
                if (presentTopologyOption.detail == "Methods") {
                    key = key.substring(0, key.length - (splt[splt.length - 1].length + 1));
                }

                if (key == filterList[j].key) {
                    cpyTopologyData.splice(i, 1);
                    i--;
                    break;
                }
            }
        }
    }

    console.log(cpyTopologyData);

    // 2. 남아있는 애들 중에 filterList에 속하는 outgoing 다 없애자
    for (var i = 0; i < cpyTopologyData.length; i++) {
        for (var j = 0; j < cpyTopologyData[i].outgoing.length; j++) {
            for (var k = 0; k < filterList.length; k++) {
                var opposite = cpyTopologyData[i].outgoing[j];
                if (opposite == mainKey)
                    continue;

                if (presentTopologyOption.detail == "Methods") {
                    // 함수 잘라냄
                    var splt = opposite.split('.');
                    opposite = opposite.substring(0, opposite.length - (splt[splt.length - 1].length + 1));
                }

                if (filterList[k].type == "class" && presentTopologyOption.detail != "Packages") {
                    if (opposite == filterList[k].key) {
                        cpyTopologyData[i].outgoing.splice(j, 1);
                        j--;
                        break;
                    }
                } else if (filterList[k].type == "package") {
                    var packName;
                    var splt = opposite.split('.');

                    if (presentTopologyOption.detail == "Packages") {
                        packName = opposite;
                    } else {
                        if (splt.length == 1)
                            packName = "(default)";
                        else
                            packName = opposite.substring(0, opposite.length - (splt[splt.length - 1].length + 1));
                    }

                    if (packName.length >= filterList[k].key.length && packName.substring(0, filterList[k].key.length) == filterList[k].key) {
                        cpyTopologyData[i].outgoing.splice(j, 1);
                        j--;
                        break;
                    }
                }
            }
        }
    }

    for (var i = 0; i < cpyTopologyData.length; i++) {
        if (cpyTopologyData[i].key == mainKey) {
            initTopology(cpyTopologyData, i, false);
            break;
        }
    }
}

function clearFilter() {
    $("#filter").hide();
    filterList = [];
    loadTopology(null, presentTopologyOption);
}

function saveFilter() {
    var data = {
        hash: hash,
        filters: JSON.stringify(filterList)
    };
    $.ajax({
        url: "http://localhost:8080/saveFilter",
        dataType: 'json',
        data: data,
        type: "POST",
        success: function (result) {
            console.log("save 성공");
            console.log(result);
        },
        error: function (req, status, err) {
            console.log("save 에러");
            alert("code:" + req.status + "\n" + "message:" + req.responseText + "\n" + "error:" + err);
        },
        complete: function () {

        }
    });
}

function defaultFilter() {
    filterList = [];
    filterList.push({
        key: "java",
        type: "package"
    });

    var $filterList = $("#filter_list");
    for (var i = 0; i < filterList.length; i++) {
        var icon = filterList[i].type == "package" ? "icon-document" : "icon-script";
        $filterList.append("<a style='cursor: default;'><span><i class='" + icon + "'></i> " + filterList[i].key + ".*</span><i class='icon-exit' style='cursor: pointer;' onclick='this.parentElement.remove();'></i></a>");
    }
}

/**************************************************************************************************/