package controller;

import function.HandleJBC;
import model.*;
import org.apache.log4j.Logger;
import org.springframework.web.bind.annotation.*;
import util.NodeType;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.Hashtable;

@RestController
@CrossOrigin(origins = "http://192.168.0.204:3000")
public class ViewTopologyController {
    private static final Logger log = Logger.getLogger(ViewTopologyController.class);

    /**
     * @param hash  해쉬값
     * @param name  토폴로지의 중심
     * @param depth 깊이
     * @return
     */
    @RequestMapping(path = "/viewTopology", method = RequestMethod.GET)
    public ArrayList<TopologyNode> viewTopology(@RequestParam("hash") String hash, @RequestParam("name") String name,
                                                @RequestParam("relation") String relation, @RequestParam("detail") String detail, @RequestParam("depth") int depth) {
        log.info("hash: " + hash);
        log.info("name: " + name);
        log.info("relation: " + relation);
        log.info("detail: " + detail);
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

        Hashtable<String, TopologyNode> topologyNodeHashtable = new Hashtable<>();

        TopologyNode main = new TopologyNode(mainNode, "main_class"); // 중심은 무조건 Class로 제한 ?
        topologyNodeHashtable.put(main.getKey(), main);

        // 중심지의 클래스를 부르는 수를 셈
        if (!relation.equals("Outgoing")) {
            // Both, Ingoing
            if (detail.equals("Methods")) {
                connectIngoingEdgeByMethod(topologyNodeHashtable, nodes, name);
            } else if (detail.equals("Classes")) {
                connectIngoingEdgeByClass(topologyNodeHashtable, nodes, name, null);
            } else {
                connectIngoingEdgeByPackage(topologyNodeHashtable, nodes, name, null);
            }
        }

        // 내가 부르는 애들을 셈
        if (!relation.equals("Ingoing")) {
            // Both, Outgoing
            if (detail.equals("Methods")) {
                connectOutgoingEdgeByMethod(topologyNodeHashtable, mainNode, main, hash);
            } else if (detail.equals("Classes")) {
                connectOutgoingEdgeNotMethod(topologyNodeHashtable, mainNode, main, hash, NodeType.CLASS);
            } else {
                connectOutgoingEdgeNotMethod(topologyNodeHashtable, mainNode, main, hash, NodeType.PACKAGE);
            }
            deleteOutgoingDuplication(main);
        }

        return new ArrayList<>(topologyNodeHashtable.values());
    }

    private void connectIngoingEdgeByPackage(Hashtable<String, TopologyNode> topologyNodeHashtable, ArrayList<Node> nodes, String name, Node pack) {
        for (Node node : nodes) {
            if (node.getType().equals("Package")) {
                connectIngoingEdgeByPackage(topologyNodeHashtable, node.getChildren(), name, node);
            } else if (node.getType().equals("Class")) {
                connectIngoingEdgeByPackage(topologyNodeHashtable, node.getChildren(), name, pack);
            } else if (node.getType().equals("Method")) {
                JBCMethod jbcMethod = (JBCMethod) node;
                for (CalledMethod calledMethod : jbcMethod.getCalledMethods()) {
                    String calledMethodName = calledMethod.getName();
                    String[] splitted = calledMethodName.split("\\.");
                    String calledClassName = calledMethodName.substring(0, calledMethodName.length() - (splitted[splitted.length - 1].length() + 1));
                    if (calledClassName.equals(name)) {
                        String longName = jbcMethod.getLongName();
                        String[] splittedLongName = longName.split("\\.");
                        if (name.equals(longName.substring(0, longName.length() - (splittedLongName[splittedLongName.length - 1].length() + 1))))
                            continue;

                        if (!topologyNodeHashtable.containsKey(pack.getLongName())) {
                            TopologyNode tn = new TopologyNode(pack, "package");
                            tn.getOutgoing().add(name);
                            topologyNodeHashtable.put(tn.getKey(), tn);
                        }
                        break;
                    }
                }
            }
        }
    }

    /**
     * @param topologyNodeHashtable 반환할 TopologyNode의 Hashtable
     * @param nodes                 탐색할 node들
     * @param name                  중심이 되는 Class의 이름
     */
    private void connectIngoingEdgeByClass(Hashtable<String, TopologyNode> topologyNodeHashtable, ArrayList<Node> nodes, String name, JBCClass jbcClass) {
        for (Node node : nodes) {
            if (node.getType().equals("Package")) {
                connectIngoingEdgeByClass(topologyNodeHashtable, node.getChildren(), name, null);
            } else if (node.getType().equals("Class")) {
                connectIngoingEdgeByClass(topologyNodeHashtable, node.getChildren(), name, (JBCClass) node);
            } else if (node.getType().equals("Method")) {
                JBCMethod jbcMethod = (JBCMethod) node;
                for (CalledMethod calledMethod : jbcMethod.getCalledMethods()) {
                    String calledMethodName = calledMethod.getName();
                    String[] splitted = calledMethodName.split("\\.");
                    String calledClassName = calledMethodName.substring(0, calledMethodName.length() - (splitted[splitted.length - 1].length() + 1));
                    if (calledClassName.equals(name)) {
                        String longName = jbcMethod.getLongName();
                        String[] splittedLongName = longName.split("\\.");
                        if (name.equals(longName.substring(0, longName.length() - (splittedLongName[splittedLongName.length - 1].length() + 1))))
                            continue;

                        if (!topologyNodeHashtable.containsKey(jbcClass.getLongName())) {
                            TopologyNode tn = new TopologyNode(jbcClass, "class");
                            tn.getOutgoing().add(name);
                            topologyNodeHashtable.put(tn.getKey(), tn);
                        }
                        break;
                    }
                }
            }
        }
    }

    private void connectIngoingEdgeByMethod(Hashtable<String, TopologyNode> topologyNodeHashtable, ArrayList<Node> nodes, String name) {
        for (Node node : nodes) {
            if (node.getType().equals("Package") || node.getType().equals("Class")) {
                connectIngoingEdgeByMethod(topologyNodeHashtable, node.getChildren(), name);
            } else if (node.getType().equals("Method")) {
                JBCMethod jbcMethod = (JBCMethod) node;
                for (CalledMethod calledMethod : jbcMethod.getCalledMethods()) {
                    String calledMethodName = calledMethod.getName();
                    String[] splitted = calledMethodName.split("\\.");
                    String calledClassName = calledMethodName.substring(0, calledMethodName.length() - (splitted[splitted.length - 1].length() + 1));
                    if (calledClassName.equals(name)) {
                        // 만약에 같은 클래스 내에서 호출한거면 패스
                        String longName = jbcMethod.getLongName();
                        String[] splittedLongName = longName.split("\\.");
                        if (name.equals(longName.substring(0, longName.length() - (splittedLongName[splittedLongName.length - 1].length() + 1))))
                            continue;

                        TopologyNode tn = new TopologyNode(jbcMethod, filterAccessModifier(jbcMethod.getAccessModifier(), jbcMethod, null));
                        tn.getOutgoing().add(name);
                        topologyNodeHashtable.put(tn.getKey(), tn);

                        break;
                    }
                }
            }
        }
    }

    private void connectOutgoingEdgeNotMethod(Hashtable<String, TopologyNode> topologyNodeHashtable, Node mainNode, TopologyNode mainTopologyNode, String hash, int detailType) {
        if (mainNode instanceof JBCClass) {
            for (Node node : mainNode.getChildren()) {
                if (node.getType().equals("Method")) {
                    JBCMethod jbcMethod = (JBCMethod) node; // 내 함수

                    for (CalledMethod calledMethod : jbcMethod.getCalledMethods()) {
                        String calledMethodName = calledMethod.getName();
                        String[] splt = calledMethodName.split("\\.");
                        String calledClassName = calledMethodName.substring(0, calledMethodName.length() - (splt[splt.length - 1].length() + 1));
                        String key = null;
                        if (calledClassName.equals(mainTopologyNode.getLongName()))
                            continue;

                        if (detailType == NodeType.PACKAGE) {
                            splt = calledClassName.split("\\.");
                            key = calledClassName.substring(0, calledClassName.length() - (splt[splt.length - 1].length() + 1));
                        } else if (detailType == NodeType.CLASS) {
                            key = calledClassName;
                        }

                        TopologyNode calledTN = null;
                        if (topologyNodeHashtable.containsKey(key)) {
                            calledTN = topologyNodeHashtable.get(key);
//                            calledTN.increaseCalledCount();
                        } else {
                            Node findedNode = null;
                            for (Node _node : HandleJBC.getAllNodesSet().get(hash)) {
                                if (findedNode != null)
                                    break;
                                findedNode = _node.findChild(key);
                            }

                            String type = detailType == NodeType.PACKAGE ? "package" : "class";
                            calledTN = new TopologyNode(findedNode, type);
                            topologyNodeHashtable.put(calledTN.getKey(), calledTN);
                        }
                        mainTopologyNode.getOutgoing().add(key);
                    }
                }
            }
        }
    }

    private void connectOutgoingEdgeByMethod(Hashtable<String, TopologyNode> topologyNodeHashtable, Node mainNode, TopologyNode mainTopologyNode, String hash) {
        if (mainNode instanceof JBCClass) {
            for (Node node : mainNode.getChildren()) {
                if (node.getType().equals("Method")) {
                    JBCMethod jbcMethod = (JBCMethod) node; // 내 함수

                    for (CalledMethod calledMethod : jbcMethod.getCalledMethods()) {
                        String calledMethodName = calledMethod.getName();
                        String[] splitted = calledMethodName.split("\\.");
                        String calledClassName = calledMethodName.substring(0, calledMethodName.length() - (splitted[splitted.length - 1].length() + 1));
                        if (calledClassName.equals(mainTopologyNode.getLongName()))
                            continue;

                        String calledMethodKey = calledMethodName + "#" + calledMethod.getSignature();
                        TopologyNode calledTN = null;
                        if (topologyNodeHashtable.containsKey(calledMethodKey)) {
                            calledTN = topologyNodeHashtable.get(calledMethodKey);
//                            calledTN.increaseCalledCount();
                        } else {
                            JBCMethod findedJBCMethod = null;
                            for (Node _node : HandleJBC.getAllNodesSet().get(hash)) {
                                if (findedJBCMethod != null)
                                    break;
                                findedJBCMethod = (JBCMethod) _node.findChild(calledMethodName, calledMethod.getSignature());
                            }

                            calledTN = new TopologyNode(findedJBCMethod, filterAccessModifier(findedJBCMethod.getAccessModifier(), findedJBCMethod, (JBCClass) mainNode));
                            topologyNodeHashtable.put(calledTN.getKey(), calledTN);
                        }
                        mainTopologyNode.getOutgoing().add(calledMethodKey);
                    }
                }
            }
        }
    }

    private String filterAccessModifier(String modifier, JBCMethod jbcMethod, JBCClass mainNode) {
        String ret = null;
        if (modifier == null && mainNode != null) {
            // 패키지이름, 클래스이름으로 구분가능
            String longName = jbcMethod.getLongName();
            int methodLength = jbcMethod.getName().length();
            String className = longName.substring(0, longName.length() - (methodLength + 1));

            if (mainNode.getSuperClassName() != null && mainNode.getSuperClassName().equals(className)) {
                return "protected";
            } else {
                return "public";
            }
        } else if (modifier.isEmpty()) return "default";

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
                ret = "unknown";
                break;
        }

        return ret;
    }

    private void deleteOutgoingDuplication(TopologyNode tn) {
        HashSet hs = new HashSet(tn.getOutgoing());
        tn.setOutgoing(new ArrayList<>(hs));
    }
}
