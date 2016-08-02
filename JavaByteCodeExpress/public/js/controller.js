$(document).ready(function () {

    hash = $("#hiddenHash").val();

    $.ajax({
        url: "http://192.168.0.204:8080/index?hash=" + hash,
        processData: false,
        contentType: false,
        data: hash,
        type: "GET",
        success: function (result) {
            console.log("hash 건네기 성공");
            console.log(result);
            constructTab(result);
            loadingModal.hide();
        },
        error: function () {
            console.log(this.data);
            console.log("hash 건네기 실패");
        }
    });

    $("#uploadButton").click(function () {
        var form = $('form')[0];
        var formData = new FormData(form);

        $("#uploadButton").attr('disabled', true);

        $.ajax({
            url: "http://192.168.0.204:8080/fileUpload",
            processData: false,
            contentType: false,
            data: formData,
            type: 'POST',
            success: function (result) {
                $("#uploadButton").attr('disabled', false);
                loadedData = result;
                console.log(loadedData);
                constructTables(loadedData);
                constructTree(loadedData);
            },
            error: function () {
                alert("에러 발생");
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

    function constructTab(nodes) {
        if (!nodes) return;

        loadedData = nodes;
        constructTables(loadedData);
        constructTree(loadedData);
    }

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
});

