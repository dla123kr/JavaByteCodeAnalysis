package controller;

import function.HandleJBC;
import model.*;
import org.apache.log4j.Logger;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.Hashtable;

@RestController
@CrossOrigin(origins = "http://192.168.0.203:3000")
public class ViewTopologyController {
    private static final Logger log = Logger.getLogger(ViewTopologyController.class);

    /**
     * @param hash  해쉬값
     * @param name  토폴로지의 중심
     * @param depth 깊이
     * @return
     */
    @RequestMapping(path = "/viewTopology", method = RequestMethod.GET)
    public ArrayList<TopologyNode> viewTopology(@RequestParam("hash") String hash, @RequestParam("name") String name, @RequestParam("depth") int depth) {
        log.info("hash: " + hash);
        log.info("name: " + name);
        log.info("depth: " + depth);

        ArrayList<Node> nodes = HandleJBC.getAllNodesSet().get(hash);
        // calledMethods 중에 name(Class)가 있으면 ....
        // 같은 곳을 다른 depth로 접근 시를 다른 경우로 보고 더 들어가야함

        // key, name(표시될이름), type(public, pro...), outgoing(ArrayList<String>)
        Node mainNode = null;
        for (Node node : nodes) {
            if (mainNode != null)
                break;
            mainNode = node.findChild(name);
        }

        // TODO: 2016-07-29 이미 불린애 안불린애 어케 처리하지? Hashtable ?
        Hashtable<String, TopologyNode> topologyNodeHashtable = new Hashtable<>();

        TopologyNode main = new TopologyNode(mainNode, "class"); // TODO: 2016-07-29 패키지인지 클래스인지에 따라 이쪽에서 구분 지어줘야함
        topologyNodeHashtable.put(main.getKey(), main);

        // 중심지의 클래스를 부르는 수를 셈
        int calledCount = calculateCalledCount(topologyNodeHashtable, nodes, name); // TODO: 2016-07-29 클래스로 묶을지, Method로 다 풀지
        main.setCalledCount(calledCount);

        // 내가 부르는 애들을 셈
        processCallingNode(topologyNodeHashtable, mainNode, main, hash); // TODO: 2016-07-29 클래스로 묶을지, Method로 다 풀지
        deleteOutgoingDuplication(main);

        return new ArrayList<>(topologyNodeHashtable.values());
    }

    /**
     * mainNode에서 호출을 찾아서 topologyNode의 outgoing에 추가
     *
     * @param mainNode
     * @param mainTopologyNode
     */
    private void processCallingNode(Hashtable<String, TopologyNode> topologyNodeHashtable, Node mainNode, TopologyNode mainTopologyNode, String hash) {
        if (mainNode instanceof JBCClass) {
            // 자식들은 함수 혹은 필드
            for (Node node : mainNode.getChildren()) {
                if (node instanceof JBCMethod) {
                    JBCMethod jbcMethod = (JBCMethod) node; // 내 함수
                    String key = jbcMethod.getLongName() + "#" + jbcMethod.getSignature();

                    // 1. jbcMethod는 내 클래스안에 있는 함수니깐, 얘가 부르는 함수들이랑 내 클래스(mainTopologyNode의 outgoind)랑 연결시켜줘야해
                    // 2. 근데 만약에 얘가 부르는 함수의 키(name#signature)가 없다면 새로 해쉬테이블에 추가, 있다면 넘어가자
                    // 2 -> 1
                    // 만약 mainTopologyNode의 class이름과 같으면 패스해야해
                    for (CalledMethod calledMethod : jbcMethod.getCalledMethods()) {
                        String methodName = calledMethod.getName();
                        String[] splitted = methodName.split("\\.");
                        String className = methodName.substring(0, methodName.length() - (splitted[splitted.length - 1].length() + 1));
                        if (className.equals(mainTopologyNode.getLongName()))
                            continue;

                        String calledKey = methodName + "#" + calledMethod.getSignature();
                        TopologyNode calledTN = null;
                        if (topologyNodeHashtable.containsKey(calledKey)) {
                            calledTN = topologyNodeHashtable.get(calledKey);
                            calledTN.increaseCalledCount();
                        } else {
                            /**
                             * 새로 calledTN을 만들어줘야 하는데
                             * isLoaded인 class에서만 찾자 !
                             * (super의 함수는 어떻게할래 ?)
                             */

                            /**
                             * jbcMethod의 modifier이랑 return type이 다 비어있으면 슈퍼
                             * 존재하지않으면 super -> 우선 unknown으로
                             */

                            JBCMethod findedJBCMethod = null;
                            for (Node _node : HandleJBC.getAllNodesSet().get(hash)) {
                                if (findedJBCMethod != null)
                                    break;
                                findedJBCMethod = (JBCMethod) _node.findChild(methodName, calledMethod.getSignature());
                            }

                            if (findedJBCMethod.getAccessModifier() == null && findedJBCMethod.getReturnType() == null) {
                                calledTN = new TopologyNode(findedJBCMethod, "unknown");
                            } else {
                                calledTN = new TopologyNode(findedJBCMethod, filterAccessModifier(findedJBCMethod.getAccessModifier()));
                            }
                            calledTN.setCalledCount(1);
                            topologyNodeHashtable.put(calledTN.getKey(), calledTN);
                        }
                        mainTopologyNode.getOutgoing().add(calledKey);
                    }
                }
            }
        }
    }

    // isLoaded인 클래스에서만 찾는다
    private int calculateCalledCount(Hashtable<String, TopologyNode> topologyNodeHashtable, ArrayList<Node> nodes, String name) {
        int ret = 0;

        for (Node node : nodes) {
            // 패키지, 클래스면 안으로 들어가고, 함수면 calledMethods를 살펴본다.
            // 이름이 일치하면 불린 횟수를 증가시키고, 그 아이를 추가한다.
            if (node.getType().equals("Package") || node.getType().equals("Class")) {
                ret += calculateCalledCount(topologyNodeHashtable, node.getChildren(), name);
            } else if (node.getType().equals("Method")) {
                JBCMethod jbcMethod = (JBCMethod) node;
                for (CalledMethod calledMethod : jbcMethod.getCalledMethods()) {
                    String calledMethodName = calledMethod.getName();
                    String[] splitted = calledMethodName.split("\\.");
                    String calledClassName = calledMethodName.substring(0, calledMethodName.length() - (splitted[splitted.length - 1].length() + 1));
                    if (calledClassName.equals(name)) {
                        // 만약에 같은 클래스 내에서 호출한거면 패스
                        // TODO: 2016-07-28 나중에 클래스 내부 보여줄 땐 없어야됨
                        String longName = jbcMethod.getLongName();
                        String[] tmp = longName.split("\\.");
                        if (name.equals(longName.substring(0, longName.length() - (tmp[tmp.length - 1].length() + 1))))
                            continue;

                        ret++;

//                        TopologyNode tn = new TopologyNode(jbcMethod.getLongName(), filterAccessModifier(jbcMethod.getAccessModifier()));
                        TopologyNode tn = new TopologyNode(jbcMethod, filterAccessModifier(jbcMethod.getAccessModifier()));
                        tn.getOutgoing().add(name); // TODO: 2016-07-28 outgoing 다시 생각해보자
                        topologyNodeHashtable.put(tn.getKey(), tn);

                        // 찾았으니 더 이상 볼 필요가 없음
                        break;
                    }
                }
            }
        }

        return ret;
    }

    private String filterAccessModifier(String modifier) {
        if (modifier == null || modifier.isEmpty()) return "unknown";

        String ret = null;
        String[] splitted = modifier.split(" ");
        switch (splitted[0]) {
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

    private void deleteOutgoingDuplication(TopologyNode tn) {
        HashSet hs = new HashSet(tn.getOutgoing());
        tn.setOutgoing(new ArrayList<>(hs));
    }
}
