jui.ready(["ui.tab"], function (tab) {

    var count = 1;

    projectTab = tab("#project-tab", {
        event: {
            change: function (data) {
                $("#project_num").html(data.index);
                // 테이블, 패키지트리에 변화 주자
            }
        }
    });


    // projectTab.insert(count, {추가할 아이템});
    insertTab = function () {
        if (count == 5)
            return;

        projectTab.insert(count, {num: count});
        // API로도 추가 쏴야함

        count++;
        if (count == 5)
            $("#btn_add_project").attr("disabled", true);
    }

    removeTab = function (index) {
        if (count == 5)
            $("#btn_add_project").attr("disabled", false);

        projectTab.remove(index);

        // 인덱스 재정렬
        for (var i = 1; i < projectTab.root.children.length - 1; i++) {
            var li = projectTab.root.children[i];
            var div = li.getElementsByTagName("div");
            div[1].innerHTML = i;
        }
        // API로도 쏴야함

        count--;
    }
});