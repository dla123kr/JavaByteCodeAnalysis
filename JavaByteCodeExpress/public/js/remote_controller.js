$(document).ready(function () {

    loadedData = window.opener.loadedData;
    hash = window.opener.hash;

    jui.ready(["grid.table", "ui.tree"], function () {
        constructTables(loadedData);
        constructTree(loadedData);
    });

});

function constructTree(nodes) {
    packageTree.uit.removeNodes();

    // nodes에는 (default)와 각종 Package들이 있음
    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];

        packageTree.append({isLoaded: true, type: "Package", name: node.name});

        // (default)와 각종 Package안에 추가로 패키지가 있다면, #dump를 추가해서 +버튼을 만들자
        if (node.packages.length > 0)
            packageTree.append(i, {isLoaded: true, type: "Class", name: "#dump"});
    }

    packageTree.foldAll();
    packageTree.open();
    packageTree.select(null);
}

function constructTables(classes) {
    // 업데이트를 하자
    detailsTable.update(classes);
};

