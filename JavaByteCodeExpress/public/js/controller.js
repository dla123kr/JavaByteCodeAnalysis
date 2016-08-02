$(document).ready(function () {

    hash = $("#hiddenHash").val();

    $.ajax({
        url: "http://192.168.0.204:8080/index?hash=" + hash,
        processData: false,
        contentType: false,
        data: {"hash": hash},
        type: "GET",
        success: function (result) {
            console.log("hash 건네기 성공");
            console.log(result);

            loadedData = result;
            filterPackagesAndClassesAtRoot(loadedData);
            constructTables(loadedData);
            constructTree(loadedData);

            loadingModal.hide();
        },
        error: function (req, status, err) {
            console.log(this.data);
            console.log("hash 건네기 실패");
            console.log("code: " + req.status + "\nmessage: " + req.responseText + "\nerror: " + err);
        }
    });

    $("#uploadButton").click(function () {
        var form = $('form')[0];
        var formData = new FormData(form);

        $("#uploadButton").attr('disabled', true);

        $.ajax({
            url: "http://192.168.0.204:8080/fileUpload",
            contentType: false,
            processData: false,
            data: formData,
            type: 'POST',
            success: function (result) {
                $("#uploadButton").attr('disabled', false);
                console.log(result);
                loadedData = result;
                filterPackagesAndClassesAtRoot(loadedData);
                constructTables(loadedData);
                constructTree(loadedData);
            },
            error: function (req, status, err) {
                alert("fileUpload 실패");
                console.log(status);
                console.log("code: " + req.status + "\nmessage: " + req.responseText + "\nerror: " + err);
                $("#uploadButton").attr('disabled', false);
            }
        });
    });

    $("#clearButton").click(function () {
        $.ajax({
            url: "http://192.168.0.204:8080/clear?hash=" + hash,
            type: "GET",
            success: function () {
                console.log("clear 성공");
                location.href = '/';
            },
            error: function () {
                console.log("clear 실패");
            }
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

        remoteController.show();
        console.log(packageTree);
    }

    function constructTables(classes) {
        // 업데이트를 하자
        detailsTable.update(classes);
    };

    function filterPackagesAndClassesAtRoot(nodes) {
        for (var i = 0; i < nodes.length; i++) {
            filterPackagesAndClasses(nodes[i]);
        }
    }

    function filterPackagesAndClasses(node) {
        var packages = [], classes = [];
        for (var i = 0; i < node.children.length; i++) {
            if (node.children[i].type == "Package") {
                packages.push(node.children[i]);
                filterPackagesAndClasses(node.children[i]);
            } else if (node.children[i].type == "Class") {
                classes.push(node.children[i]);
                filterPackagesAndClasses(node.children[i]);
            }
        }

        node.packages = packages;
        node.classes = classes;
    }
});

