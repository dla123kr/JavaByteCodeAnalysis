package controller;

import function.HandleJBC;
import model.JBCMethod;
import model.Node;
import model.TopologyNode;
import org.apache.log4j.Logger;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;

@RestController
@CrossOrigin(origins = "http://192.168.0.203:3000")
public class ViewTopologyController {
    private static final Logger log = Logger.getLogger(ViewTopologyController.class);

    @RequestMapping(path = "/viewTopology", method = RequestMethod.GET)
    public ArrayList<TopologyNode> viewTopology(@RequestParam("hash") String hash, @RequestParam("name") String name, @RequestParam("depth") int depth) {
        log.info("hash: " + hash);
        log.info("name: " + name);
        log.info("depth: " + depth);

        ArrayList<Node> nodes = HandleJBC.getAllNodesSet().get(hash);
        // calledMethods 중에 name(Class)가 있으면 ....
        // 같은 곳을 다른 depth로 접근 시를 다른 경우로 보고 더 들어가야함

        // key, name(표시될이름), type(public, pro...), outgoing(ArrayList<String>)
        ArrayList<TopologyNode> ret = new ArrayList<>();
        TopologyNode main = new TopologyNode(name, "class");
        ret.add(main);

        int calledCount = calculateCalledCount(ret, nodes, name);
        main.setCalledCount(calledCount);

        return ret;
    }

    private int calculateCalledCount(ArrayList<TopologyNode> topologyNodes, ArrayList<Node> nodes, String name) {
        int ret = 0;

        for (Node node : nodes) {
            // 패키지, 클래스면 안으로 들어가고, 함수면 calledMethods를 살펴본다.
            // 이름이 일치하면 불린 횟수를 증가시키고, 그 아이를 추가한다.
            if (node.getType().equals("Package") || node.getType().equals("Class")) {
                ret += calculateCalledCount(topologyNodes, node.getChildren(), name);
            } else if (node.getType().equals("Method")) {
                JBCMethod jbcMethod = (JBCMethod) node;
                for (String calledMethodName : jbcMethod.getCalledMethods()) {
                    String[] splitted = calledMethodName.split("\\.");
                    String calledClassName = calledMethodName.substring(0, calledMethodName.length() - (splitted[splitted.length - 1].length() + 1));
                    if (calledClassName.equals(name)) {
                        // 만약에 같은 클래스 내에서 호출한거면 패스
                        // TODO: 2016-07-28 나중에 클래스 내부 보여줄 땐 없어야됨
                        String longName = jbcMethod.getLongName();
                        String[] tmp = longName.split("\\.");
                        if(name.equals(longName.substring(0, longName.length() - (tmp[tmp.length - 1].length() + 1))))
                            continue;

                        ret++;

                        TopologyNode tn = new TopologyNode(jbcMethod.getLongName(), filterAccessModifier(jbcMethod.getAccessModifier()));
                        tn.getOutgoing().add(name); // TODO: 2016-07-28 outgoing 다시 생각해보자
                        topologyNodes.add(tn);

                        // 찾았으니 더 이상 볼 필요가 없음
                        break;
                    }
                }
            }
        }

        return ret;
    }

    private String filterAccessModifier(String modifier) {
        if (modifier.isEmpty()) return "default";

        String ret = null;
        String[] splitted = modifier.split(" ");
        switch(splitted[0]){
            case "public":
                ret = "public";
                break;
            case "protected":
                ret = "protected";
                break;
            case "private":
                ret = "private";
                break;
            default:
                ret = "default";
                break;
        }

        return ret;
    }
}
