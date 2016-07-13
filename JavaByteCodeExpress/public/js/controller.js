$(document).ready(function(){
    $("#uploadButton").click(function () {
        alert("눌렀다");
        var form = $('form')[0];
        var formData = new FormData(form);

        $.ajax({
            url: "http://localhost:8080/",
            processData: false,
            contentType: false,
            data: formData,
            type: 'POST',
            success: function (result) {
                console.log(result);
                alert("업로드 성공!!");
            },
            error: function () {
                alert("에러 발생");
            }
        });
    });
});