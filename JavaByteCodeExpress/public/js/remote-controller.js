jui.ready(["ui.window"], function (win) {
    remoteController = win("#remote-controller", {
        width: 300,
        height: 300,
        left: "3%",
        top: 300,
        resize: true,
        move: true,

    });
});

jui.ready(["ui.tree"], function (tree) {

    var previousOpenIndex = "-1";
    var previousSelectIndex = "-1";

    packageTree = tree("#package-tree", {
        root: {isLoaded: true, type: "Package", name: "All"},
        event: {
            select: function (node) {
                if (node.index == null) {
                    this.uit.removeNodes();

                    for (var i = 0; i < loadedData.length; i++) {
                        var node = loadedData[i];

                        this.append({isLoaded: true, type: "Package", name: node.name});
                        this.append(i, {isLoaded: true, type: "Class", name: "#dump"});
                    }

                    this.foldAll();
                    this.open();
                    this.select(node.index);

                    detailsTable.update(loadedData);
                    return;
                }

                if (node.data.type == "Package" && previousSelectIndex != node.index) {
                    if (node.children[0].data.name == "#dump")
                        this.open(node.index);
                    previousSelectIndex = node.index;

                    // 테이블 업데이트 ?
                    var datas = filterNode(node.index);
                    detailsTable.update(datas);

                    this.select(node.index);
                }
            },
            open: function (node) {
                if (node.index == null) {
                    previousOpenIndex = "-1";
                    previousSelectIndex = "-1";
                    return;
                }

                // 이전에 열은 것이 직계면 밑에서 fold 되므로 걸러줘야함
                var isParent = false;
                var minLength = previousOpenIndex.length < node.index.length ? previousOpenIndex.length : node.index.length;
                if (previousOpenIndex.substring(0, minLength) == node.index.substring(0, minLength)) // 같은 직계
                    isParent = true;

                // 닫히는 이전 index
                if (previousOpenIndex != "-1" && previousOpenIndex != node.index && !isParent) {
                    // 이전껄 바로 닫는게 아니라 갯수 맞춰서 닫자
                    // length 적은걸로 닫는다
                    // 내 부모면 안되는데 ..................................
                    var previousArr = previousOpenIndex.split('.');
                    var presentArr = node.index.split('.');
                    var mmin = previousArr.length < presentArr.length ? previousArr.length : presentArr.length;

                    var closeIndex = previousArr[0];
                    for (var i = 1; i < mmin; i++)
                        closeIndex += "." + previousArr[i];

                    if (this.get(closeIndex).data.type == "Package")
                        this.fold(closeIndex);
                }

                // 열리는 이번 index
                this.remove(node.children[0].index); // #dump 제거
                addNode(node.index);

                previousOpenIndex = node.index;
            },
            fold: function (node) {
                if (node.index == null)
                    return;
                if (node.children.length > 0 && node.children[0].data.name == "#dump")
                    return;

                var idx = node.index;
                var data = node.data;

                this.remove(idx);
                this.insert(idx, data);
                this.append(idx, {isLoaded: true, type: "Class", name: "#dump"});
                this.fold(idx);
            }
        }
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

    function addNode(index) {
        var splitted = index.split('.');
        var nodes = loadedData;
        for (var i = 0; i < splitted.length; i++) {
            if (nodes == loadedData)
                nodes = nodes[splitted[i]];
            else
                nodes = nodes.children[splitted[i]];
        }

        for (var i = 0; i < nodes.children.length; i++) {
            var node = nodes.children[i];

            if (node.type == "Package") {
                packageTree.append(index, {isLoaded: true, type: "Package", name: node.name});
                packageTree.append(index + "." + i.toString(), {isLoaded: true, type: "Class", name: "#dump"});
                packageTree.fold(index + "." + i.toString());
            } else if (node.type == "Class") {
                packageTree.append(index, {isLoaded: node.isLoaded, type: "Class", name: node.name});
            }
        }
    }
});

jui.ready(["ui.switch"], function (button) {
    switchTree = button("#switch-tree", {
        checked: true
    });


    $("#switch-tree").click(function () {
        if (!switchTree.getValue()) {
            remoteController.hide();
        } else {
            remoteController.show();
        }
    });
});