$(document).ready(function () {

    hash = $("#hiddenHash").val();

    $.ajax({
        url: "http://localhost:8080/index?hash=" + hash,
        processData: false,
        contentType: false,
        data: {"hash": hash},
        type: "GET",
        success: function (result) {
            console.log("hash 건네기 성공");
            console.log(result);

            loadedData = result;
            filterPackagesAndClassesAtRoot(loadedData);

            loadingModal.hide();
            openRemoteController();

            $.ajax({
                url: "http://localhost:8080/loadFilter?hash=" + hash,
                type: "GET",
                success: function (result) {
                    console.log("loadFilter 성공");
                    filterList = result;
                },
                error: function () {
                    console.log("loadFilter 실패");
                }
            });
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
            url: "http://localhost:8080/fileUpload",
            contentType: false,
            processData: false,
            data: formData,
            type: 'POST',
            success: function (result) {
                $("#uploadButton").attr('disabled', false);
                console.log(result);
                loadedData = result;
                filterPackagesAndClassesAtRoot(loadedData);

                openRemoteController();
            },
            error: function (req, status, err) {
                alert("fileUpload 실패");
                console.log(status);
                console.log("code: " + req.status + "\nmessage: " + req.responseText + "\nerror: " + err);
                $("#uploadButton").attr('disabled', false);
            }
        });

        $("#help_div").css('display', 'block');
        $("#topology_div").css('display', 'none');
    });

    $("#clearButton").click(function () {
        $.ajax({
            url: "http://localhost:8080/clear?hash=" + hash,
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

