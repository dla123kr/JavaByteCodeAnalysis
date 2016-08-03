jui.ready(null, function () {
    var chart = jui.include("chart.builder");
    chartWidth = 1480, chartHeight = 785;

    var data = [
        {
            key: "1000_1",
            name: "W1",
            type: "protected",
            x: chartWidth / 2,
            y: chartHeight / 2,
            outgoing: ["1000_2", "1000_4"]
        },
        {key: "1000_2", name: "W2", type: "class", x: 300, y: 200, outgoing: ["1000_3", "1000_4"]},
        {key: "1000_3", name: "W3", type: "private", x: 300, y: 100, outgoing: ["1_2_3_4", "1000_2"]},
        {key: "1000_4", name: "W4", type: "public", x: 400, y: 100, outgoing: ["1_2_3_4"]},
        {key: "1_2_3_4", name: "Oracle", type: "default", x: chartWidth / 2, y: chartHeight / 2, outgoing: []},
        {key: "1000_5", name: "패키지", type: "package", outgoing: []}
    ];

    $('#topology').bind('mousewheel DOMMouseScroll', function (e) {
        return false;
    });

    function rnd(count) {
        return Math.floor(Math.random() * count);
    }

    jui.define("topology.custom.sort", [], function () {
        return function (data, area, space) {
            console.log("=== arguments ===");
            console.log(arguments);

            var xy = [];

            for (var i = 0; i < data.length; i++) {
                if (data[i].x == undefined || data[i].y == undefined) {
                    data[i].x = rnd(chartWidth - 20);
                    data[i].y = rnd(chartHeight - 20);
                }
                xy.push({x: data[i].x, y: data[i].y});
            }

            return xy;
        }
    });

    initTopology = function (data) {
        if (data == null)
            data = [];
        $("#topology").empty();

        topologyChart = chart("#topology", {
            width: chartWidth,
            height: chartHeight,
            padding: 5,
            axis: {
                c: {
                    type: "topologytable",
                    sort: "topology.custom.sort"
                },
                data: data
            },
            brush: {
                type: "topologynode",
                nodeImage: function (data) {
                    if (data.type == "main_class") {
                        return "/images/main_class.png";
                    } else if (data.type == "main_package") {
                        return "images/main_package.png";
                    } else if (data.type == "public") {
                        return "/images/public.png";
                    } else if (data.type == "protected") {
                        return "/images/protected.png";
                    } else if (data.type == "private") {
                        return "/images/private.png";
                    } else if (data.type == "class") {
                        return "/images/class.png";
                    } else if (data.type == "package") {
                        return "/images/package.png";
                    } else if (data.type == "unknown") {
                        return "/images/unknown.png";
                    } else if (data.type == "default") {
                        return "/images/default.png";
                    }
                },
                nodeTitle: function (data) {
                    return data.name;
                },
                nodeScale: function (data) {
                    if (data.type == "main_package")
                        return 2.3;
                    else if (data.type == "main_class")
                        return 2;
                    else if (data.type == "unknown")
                        return 0.6;
                    else if (data.type == "class")
                        return 1;
                    else if (data.type == "package")
                        return 1.2;
                    else
                        return 0.8;
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
    }
});