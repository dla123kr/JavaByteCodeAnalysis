$(document).ready(function () {
    $("#uploadButton").click(function () {
        var form = $('form')[0];
        var formData = new FormData(form);

        $("#uploadButton").attr('disabled', true);

        $.ajax({
            url: "http://localhost:8080/",
            processData: false,
            contentType: false,
            data: formData,
            type: 'POST',
            success: function (result) {
                $("#uploadButton").attr('disabled', false);
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

    function loadTables(classes) {
        if (isFirstLoad) {
            $("#details-table").css("visibility", "visible");
            isFirstLoad = false;
        }
        console.log(classes);

        // 업데이트를 하자
        detailsTable.update(classes);
    };
});

