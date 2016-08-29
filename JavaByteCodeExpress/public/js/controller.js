$(document).ready(function () {

    hash = $("#hiddenHash").val();

    $.ajax({
        url: "http://localhost:8080/index?hash=" + hash,
        processData: false,
        contentType: false,
        data: {"hash": hash},
        type: "GET",
        success: function (result) {
            console.log(result);

            loadedData = result;
            filterPackagesAndClassesAtRoot(loadedData);

            loadingModal.hide();

            var $intro = $("#intro_div");
            var introText;
            if (loadedData.length > 0) {
                introText =
                    "안녕하세요, 사용하신 적이 있으시군요.<br/>" +
                    "이전 데이터 사용을 원하시면, 바로 위에 <a class='btn' style='margin-bottom: 7px; font-size: 17px;'><i class='icon-profile'></i> Remote Controller</a>를 이용하여 조작해주세요.<br/><br/>" +
                    "새 파일을 분석하고 싶다면, 첨부한 후에 <a class='btn focus' style='margin-bottom: 7px;'>Load</a>를 해주세요.<br/>" +
                    "기록을 지우고 싶으시다면 <a class='btn' style='margin-bottom: 7px;'>Clear</a>를 하시면 돼요.<br/>";

                notify_submit("success", "데이터 불러오기 성공");
                openRemoteController();
            } else {
                introText =
                    "안녕하세요, 처음 오셨군요.<br/>" +
                    "파일을 첨부하고 <a class='btn focus' style='margin-bottom: 7px;'>Load</a>를 해주세요.<br/><br/>" +
                    "Load가 완료되면 리모콘이 나타나 조작을 할 수 있을거에요.<br/>";
            }
            $intro[0].innerHTML = introText;

            $.ajax({
                url: "http://localhost:8080/loadFilter?hash=" + hash,
                type: "GET",
                success: function (result) {
                    filterList = result;
                    if (filterList.length > 0)
                        notify_submit("success", "필터 불러오기 성공");
                },
                error: function () {
                    notify_submit("danger", "필터 불러오기 실패");
                }
            });
        },
        error: function (req, status, err) {
            console.log(this.data);
            notify_submit("danger", "데이터 불러오기 실패");
            console.log("code: " + req.status + "\nmessage: " + req.responseText + "\nerror: " + err);
        }
    });

    $("#uploadButton").click(function () {
        var form = $('form')[0];
        var formData = new FormData(form);

        loadingModal.show();

        $.ajax({
            url: "http://localhost:8080/fileUpload",
            contentType: false,
            processData: false,
            data: formData,
            type: 'POST',
            success: function (result) {
                notify_submit("success", "데이터 불러오기 성공");
                console.log(result);
                loadedData = result;
                filterPackagesAndClassesAtRoot(loadedData);

                openRemoteController();
            },
            error: function (req, status, err) {
                notify_submit("danger", "데이터 업로드 실패");
                console.log(status);
                console.log("code: " + req.status + "\nmessage: " + req.responseText + "\nerror: " + err);
            },
            complete: function () {
                loadingModal.hide();
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
                location.href = '/';
            },
            error: function () {
                notify_submit("danger", "데이터 초기화 실패");
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

