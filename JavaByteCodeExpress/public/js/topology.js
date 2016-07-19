jui.ready(null, function () {
    var chart = jui.include("chart.builder");

    var data = [
        {key: "1000_1", name: "W1", type: "was", outgoing: ["1000_2", "1000_4"]},
        {key: "1000_2", name: "W2", type: "was", outgoing: ["1000_3", "1000_4"]},
        {key: "1000_3", name: "W3", type: "was", outgoing: ["1_2_3_4", "1000_2"]},
        {key: "1000_4", name: "W4", type: "server", outgoing: ["1_2_3_4"]},
        {key: "1_2_3_4", name: "Oracle", type: "db", outgoing: []}
    ];

    topologyChart = chart("#topology", {
        padding: 5,
        axis: {
            c: {
                type: "topologytable"
            },
            data: data
        },
        brush: {
            type: "topologynode",
            nodeImage: function (data) {
                if (data.type == "server") {
                    return "/images/public.png";
                } else if (data.type == "was") {
                    return "/images/protected.png";
                } else {
                    return "/images/default.png";
                }
            },
            nodeTitle: function (data) {
                return data.name;
            }
        },
        widget: {
            type: "topologyctrl",
            zoom: true,
            move: true // 토폴로지 덩어리를 옮길 수 있게 할 것인가?
        },
        style: {
            topologyNodeRadius: 15 // 이미지 크기
        }
    });

    $('#topology').bind('mousewheel DOMMouseScroll', function(e) { return false; });
});