var filterTree = null;

var filterIsShow = false;

jui.ready(["ui.modal"], function (modal) {
    $("#topology_modal").appendTo("body");

    topologyModal = modal("#topology_modal", {
        color: "black",
        event: {
            click: function (e) {
                console.log("aa");
            }
        }
    });

    oriTopologyModalHeight = null;
    $(window).scroll(function () {
        $("#topology_modal").css("top", oriTopologyModalHeight + $(document).scrollTop());
    });

});

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

    initTopology(originTopologyData, originTopologyData[originTopologyMainIndex].key);
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

    var centerKey;
    for (var i = 0; i < cpyTopologyData.length; i++) {
        if (cpyTopologyData[i].type == "main_class" || cpyTopologyData[i].type == "main_method") {
            centerKey = cpyTopologyData[i].key;
            break;
        }
    }
    initTopology(cpyTopologyData, centerKey);
}