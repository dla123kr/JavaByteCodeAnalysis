jui.ready(["ui.window"], function (win) {
    remoteController = win("#remote-controller", {
        width: 300,
        height: 300,
        left: "3%",
        top: 300,
        resize: false,
        move: true,

    });
});

jui.ready(["ui.tree"], function (tree) {
    packageTree = tree("#package-tree", {
        root: {loaded: true, name: "All"},
        event: {
            select: function (node) {
                this.select(node.index);
                alert("index(" + node.index + "), title(" + node.data.name + ")");
                
            }
        }
    });

    // packageTree.append({title: "Windows"});
    // packageTree.append({title: "Download"});
    // packageTree.append({title: "Program Files"});
    // packageTree.append({title: "Apache"});
    // packageTree.append("0", {title: "run.exe"});
    // packageTree.append("0", {title: "setting.conf"});
    // packageTree.append("1", {title: "jui.torrrent"});
    // packageTree.insert("2.0", {title: "Riot Games"});
    // packageTree.insert("2.0.0", {title: "lol.exe"});
    // packageTree.append("3", {title: "startup.bat"});
    //
    // packageTree.foldAll();
    // packageTree.open();
});