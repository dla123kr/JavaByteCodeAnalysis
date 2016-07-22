$(document).ready(function () {

    var isFirstLoad = true;

    $("#uploadButton").click(function () {
        var form = $('form')[0];
        var formData = new FormData(form);

        $("#uploadButton").attr('disabled', true);

        $.ajax({
            url: "http://localhost:8080/clear/",
            processData: false,
            contentType: false,
            data: null,
            type: 'GET',
            success: function (flag) {
                console.log(flag);
            },
            error: function () {
                alert("Clear 실패");
            }
        });

        $.ajax({
            url: "http://localhost:8080/",
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
            url: "http://localhost:8080/clear/",
            processData: false,
            contentType: false,
            data: null,
            type: 'GET',
            success: function (flag) {
                console.log(flag);
                location.href = '/';
            },
            error: function () {
                alert("Clear 실패");
            }
        });
    });

    function constructTree(nodes) {
        packageTree.uit.removeNodes();

        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];

            packageTree.append({isLoaded: true, type: "Package", name: node.name});
            packageTree.append(i, {isLoaded: true, type: "Class", name: "#dump"});
        }

        packageTree.foldAll();
        packageTree.open();
        packageTree.select(null);

        remoteController.show();
        console.log(packageTree);
    }

    function constructTables(classes) {
        if (isFirstLoad) {
            $("#content-main").css("visibility", "visible");

            isFirstLoad = false;
        }

        // 업데이트를 하자
        detailsTable.update(classes);
    };
});

