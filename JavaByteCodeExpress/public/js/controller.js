$(document).ready(function () {
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
                globalData = result;
                loadTree(result);
                loadTables(result);
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

    var isFirstLoad = true;
    var globalData = null;

    function loadTables(classes) {
        if (isFirstLoad) {
            $("#content-main").css("visibility", "visible");

            isFirstLoad = false;
        }
        remoteController.show();

        console.log(classes);

        // 업데이트를 하자
        detailsTable.update(classes);
        // topologyChart.axis(0).update([{key: "1000_1", name: "W1", type: "was", outgoing: ["1000_2"]},
        //     {key: "1000_2", name: "W2", type: "was", outgoing: []}]);
    };

    function loadTree(classes) {
        var yesPack = [], noPack = [];
        // tree로 구축
        for (var i = 0; i < classes.length; i++) {
            var clazz = classes[i];
            var isLoaded = clazz.loaded;
            var pack = (clazz.inAnyPackage != null) ? clazz.inAnyPackage : "(default)"; // 스플릿하자
            var name = clazz.className;

            var node = {"loaded": isLoaded, "packageName": pack, "className": name};
            if (pack != "(default)")
                yesPack.push(node);
            else
                noPack.push(node);
        }

        // 패키지 분리 작업
        // 인덱스 찾아내자
        for (var i = 0; i < yesPack.length; i++) {
            var item = {loaded: yesPack[i].loaded, name: yesPack[i].className};
            appendNode(yesPack[i].packageName, item);
        }

        // default package 추가
        packageTree.append({loaded: true, name: "(default)"});
        var defaultIdx;
        for (defaultIdx = 0; defaultIdx < packageTree.uit.getRoot().children.length; defaultIdx++)
            if (packageTree.uit.getRoot().children[defaultIdx].data.name == "(default)")
                break;
        for (var i = 0; i < noPack.length; i++)
            packageTree.append(defaultIdx, {loaded: noPack[i].loaded, name: noPack[i].className});

        packageTree.foldAll();
        packageTree.open();
    };

    /**
     * pack별로 잘 짤라서 idx 이쁘게 만들어주고 node 추가
     * @param pack
     * @param item
     */
    function appendNode(pack, item) {
        var arr = pack.split('.');
        var idx = null;
        var isFinded;
        var j = 0;

        // 디렉토리 만드는 중
        for (var i = 0; i < arr.length; i++) {
            isFinded = false;

            if (idx == null) {
                for (j = 0; j < packageTree.uit.getRoot().children.length; j++) {
                    if (packageTree.uit.getNode(j.toString()).data.name == arr[i]) {
                        isFinded = true;
                        break;
                    }
                }
                if (!isFinded)
                    packageTree.append({loaded: true, name: arr[i]});
            } else {
                for (j = 0; j < packageTree.uit.getNode(idx).children.length; j++) {
                    if (packageTree.uit.getNode(idx + "." + j.toString()).data.name == arr[i]) {
                        isFinded = true;
                        break;
                    }
                }
                if (!isFinded)
                    packageTree.append(idx, {loaded: true, name: arr[i]});
            }

            if (idx == null)
                idx = j.toString();
            else
                idx += "." + j.toString();
        }

        packageTree.append(idx, item);
    };
});

