package controller;

import function.HandleJBC;
import model.*;
import org.apache.log4j.Logger;
import org.springframework.web.bind.annotation.*;
import util.NodeType;

import java.util.AbstractMap;
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
    public ArrayList<TopologyNode> viewTopology(@RequestParam("hash") String hash, @RequestParam("name") String name, @RequestParam("type") String type,
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
        name = name.replace('*', '#');
        String[] splt = name.split("#");
        String signature = null;
        if (splt.length > 1) {
            name = splt[0];
            signature = splt[1];
        }

        Node mainNode = null;
        for (Node node : nodes) {
            if (mainNode != null)
                break;
            if (signature != null) {
                mainNode = node.findChild(name, signature);
            } else {
                mainNode = node.findChild(name);
            }
        }
        if (splt.length > 1) {
            name = splt[0] + "#" + splt[1];
        }

        Hashtable<String, TopologyNode> topologyNodeHashtable = new Hashtable<>();

        String mainType = signature == null ? "main_class" : "main_method";
        TopologyNode main = new TopologyNode(mainNode, mainType); // 중심은 무조건 Class로 제한 ?
        topologyNodeHashtable.put(main.getKey(), main);

        // 중심지의 클래스를 부르는 수를 셈
        if (!relation.equals("Outgoing")) {
            // Both, Ingoing
            if (detail.equals("Methods")) {
                connectIngoingEdgeByMethod(topologyNodeHashtable, nodes, name, mainType);
            } else if (detail.equals("Classes")) {
                connectIngoingEdgeNotMethod(topologyNodeHashtable, nodes, name, null, mainType, NodeType.CLASS);
            } else {
                connectIngoingEdgeNotMethod(topologyNodeHashtable, nodes, name, null, mainType, NodeType.PACKAGE);
            }
        }

        // 내가 부르는 애들을 셈
        if (!relation.equals("Ingoing")) {
            // Both, Outgoing
            if (detail.equals("Methods")) {
                if (mainType.equals("main_class")) {
                    connectOutgoingEdgeByMethodInClass(topologyNodeHashtable, mainNode, main, hash);
                } else if (mainType.equals("main_method")) {
                    connectOutgoingEdgeByMethodInMethod(topologyNodeHashtable, (JBCMethod) mainNode, main, hash, "main_method");
                }
            } else if (detail.equals("Classes")) {
                if (mainType.equals("main_class")) {
                    connectOutgoingEdgeNotMethodInClass(topologyNodeHashtable, mainNode, main, hash, NodeType.CLASS);
                } else if (mainType.equals("main_method")) {
                    connectOutgoingEdgeNotMethodInMethod(topologyNodeHashtable, (JBCMethod) mainNode, main, hash, "main_method", NodeType.CLASS);
                }
            } else {
                if (mainType.equals("main_class")) {
                    connectOutgoingEdgeNotMethodInClass(topologyNodeHashtable, mainNode, main, hash, NodeType.PACKAGE);
                } else if (mainType.equals("main_method")) {
                    connectOutgoingEdgeNotMethodInMethod(topologyNodeHashtable, (JBCMethod) mainNode, main, hash, "main_method", NodeType.PACKAGE);
                }
            }
            deleteOutgoingDuplication(main);
        }

        return new ArrayList<>(topologyNodeHashtable.values());
    }

    /**
     * @param topologyNodeHashtable 전체 Topology 정보를 담고 있는 해쉬테이블
     * @param nodes                 탐색할 Children
     * @param name                  중심의 이름
     * @param parent                부모
     * @param detailType            중앙의 타입
     */
    private void connectIngoingEdgeNotMethod(Hashtable<String, TopologyNode> topologyNodeHashtable, ArrayList<Node> nodes, String name, Node parent, String mainType, int detailType) {
        for (Node node : nodes) {
            Node param = null;
            if (node.getType().equals("Package")) {
                param = detailType == NodeType.PACKAGE ? node : null;
                connectIngoingEdgeNotMethod(topologyNodeHashtable, node.getChildren(), name, param, mainType, detailType);
            } else if (node.getType().equals("Class")) {
                param = detailType == NodeType.PACKAGE ? parent : node;
                connectIngoingEdgeNotMethod(topologyNodeHashtable, node.getChildren(), name, param, mainType, detailType);
            } else if (node.getType().equals("Method")) {
                JBCMethod jbcMethod = (JBCMethod) node; // 이 함수가 부른 애들 중에서 name이 있으면 추가할거야.
                if (checkParentRelation(name, jbcMethod, mainType)) {
                    continue;
                }

                for (CalledMethod calledMethod : jbcMethod.getCalledMethods()) {
                    String calledMethodName = calledMethod.getName();
                    String[] splt = calledMethodName.split("\\.");

                    String calledKey = null;
                    if (mainType.equals("main_class")) {
                        calledKey = calledMethodName.substring(0, calledMethodName.length() - (splt[splt.length - 1].length() + 1));
                    } else if (mainType.equals("main_method")) {
                        calledKey = calledMethod.getName() + "#" + calledMethod.getSignature();
                    }

                    if (calledKey.equals(name)) {
                        if (!topologyNodeHashtable.containsKey(parent.getLongName())) {
                            String type = detailType == NodeType.PACKAGE ? "package" : "class";
                            TopologyNode tn = new TopologyNode(parent, type);
                            tn.getOutgoing().add(name);
                            topologyNodeHashtable.put(tn.getKey(), tn);
                        }
                        break;
                    }
                }
            }
        }
    }

    private void connectIngoingEdgeByMethod(Hashtable<String, TopologyNode> topologyNodeHashtable, ArrayList<Node> nodes, String name, String mainType) {
        for (Node node : nodes) {
            if (node.getType().equals("Package") || node.getType().equals("Class")) {
                connectIngoingEdgeByMethod(topologyNodeHashtable, node.getChildren(), name, mainType);
            } else if (node.getType().equals("Method")) {
                JBCMethod jbcMethod = (JBCMethod) node;
                if (checkParentRelation(name, jbcMethod, mainType)) {
                    continue;
                }

                for (CalledMethod calledMethod : jbcMethod.getCalledMethods()) {
                    String calledMethodName = calledMethod.getName();
                    String[] splt = calledMethodName.split("\\.");

                    String calledKey = null;
                    if (mainType.equals("main_class")) {
                        calledKey = calledMethodName.substring(0, calledMethodName.length() - (splt[splt.length - 1].length() + 1));
                    } else if (mainType.equals("main_method")) {
                        calledKey = calledMethod.getName() + "#" + calledMethod.getSignature();
                    }

                    if (calledKey.equals(name)) {
                        TopologyNode tn = new TopologyNode(jbcMethod, filterAccessModifier(jbcMethod.getAccessModifier(), jbcMethod, null));
                        tn.getOutgoing().add(name);
                        topologyNodeHashtable.put(tn.getKey(), tn);
                        break;
                    }
                }
            }
        }
    }

    private boolean checkParentRelation(String name, JBCMethod jbcMethod, String mainType) {
        if (mainType.equals("main_class")) {
            String methodLongName = jbcMethod.getLongName();
            String[] splt = methodLongName.split("\\.");
            // 클래스가 같으면 continue;
            if (name.equals(methodLongName.substring(0, methodLongName.length() - (splt[splt.length - 1].length() + 1)))) {
                return true;
            }
        } else if (mainType.equals("main_method")) {
            String methodLongName = jbcMethod.getLongName() + "#" + jbcMethod.getSignature();
            // 재귀호출 시 continue;
            if (name.equals(methodLongName)) {
                return true;
            }
        }

        return false;
    }

    private void connectOutgoingEdgeNotMethodInClass(Hashtable<String, TopologyNode> topologyNodeHashtable, Node mainNode, TopologyNode mainTopologyNode, String hash, int detailType) {
        for (Node node : mainNode.getChildren()) {
            if (node.getType().equals("Method")) {
                JBCMethod jbcMethod = (JBCMethod) node; // 내 함수
                connectOutgoingEdgeNotMethodInMethod(topologyNodeHashtable, jbcMethod, mainTopologyNode, hash, "main_class", detailType);
            }
        }
    }

    private void connectOutgoingEdgeNotMethodInMethod(Hashtable<String, TopologyNode> topologyNodeHashtable, JBCMethod jbcMethod, TopologyNode mainTopologyNode, String hash, String mainType, int detailType) {
        for (CalledMethod calledMethod : jbcMethod.getCalledMethods()) {
            String calledMethodName = calledMethod.getName();
            String[] splt = calledMethodName.split("\\.");

            String calledKey = null;
            if (mainType.equals("main_class")) {
                calledKey = calledMethodName.substring(0, calledMethodName.length() - (splt[splt.length - 1].length() + 1));
            } else if (mainType.equals("main_method")) {
                calledKey = calledMethod.getName() + "#" + calledMethod.getSignature();
            }
            if (calledKey.equals(mainTopologyNode.getKey())) {
                continue;
            }

            if (detailType == NodeType.PACKAGE) {
                splt = calledKey.split("\\.");
                if (mainType.equals("main_class")) {
                    calledKey = calledKey.substring(0, calledKey.length() - (splt[splt.length - 1].length() + 1)); // Class이름 제외하고 Package만 뽑아냄
                } else if (mainType.equals("main_method")) {
                    if(splt.length > 2)
                        calledKey = calledKey.substring(0, calledKey.length() - (splt[splt.length - 1].length() + splt[splt.length - 2].length() + 2)); // Method, Class이름 제외하고 Package만 뽑아냄
                    else
                        calledKey = "(default)";
                }
            } else if (detailType == NodeType.CLASS) {
                splt = calledKey.split("\\.");
                if (mainType.equals("main_method")) {
                    calledKey = calledKey.substring(0, calledKey.length() - (splt[splt.length - 1].length() + 1)); // Method이름 제외하고 Class만 뽑아냄
                }
            }

            TopologyNode calledTN = null;
            if (topologyNodeHashtable.containsKey(calledKey)) {
                calledTN = topologyNodeHashtable.get(calledKey);
                // calledTN.increaseCalledCount();
            } else {
                Node findedNode = null;
                for (Node _node : HandleJBC.getAllNodesSet().get(hash)) {
                    if (findedNode != null)
                        break;
                    findedNode = _node.findChild(calledKey);
                }

                String type = detailType == NodeType.PACKAGE ? "package" : "class";
                calledTN = new TopologyNode(findedNode, type);
                topologyNodeHashtable.put(calledTN.getKey(), calledTN);
            }
            mainTopologyNode.getOutgoing().add(calledKey);
        }
    }

    private void connectOutgoingEdgeByMethodInClass(Hashtable<String, TopologyNode> topologyNodeHashtable, Node mainNode, TopologyNode mainTopologyNode, String hash) {
        for (Node node : mainNode.getChildren()) {
            if (node.getType().equals("Method")) {
                JBCMethod jbcMethod = (JBCMethod) node; // 내 함수
                connectOutgoingEdgeByMethodInMethod(topologyNodeHashtable, jbcMethod, mainTopologyNode, hash, "main_class");
            }
        }
    }

    private void connectOutgoingEdgeByMethodInMethod(Hashtable<String, TopologyNode> topologyNodeHashtable, JBCMethod jbcMethod, TopologyNode mainTopologyNode, String hash, String mainType) {
        for (CalledMethod calledMethod : jbcMethod.getCalledMethods()) {
            String calledMethodName = calledMethod.getName();
            String[] splt = calledMethodName.split("\\.");

            String calledKey = null;
            if (mainType.equals("main_class")) {
                calledKey = calledMethodName.substring(0, calledMethodName.length() - (splt[splt.length - 1].length() + 1)); // 클래스 이름
            } else if (mainType.equals("main_method")) {
                calledKey = calledMethod.getName() + "#" + calledMethod.getSignature(); // 함수 이름
            }
            if (calledKey.equals(mainTopologyNode.getKey())) {
                continue;
            }

            String calledMethodKey = calledMethodName + "#" + calledMethod.getSignature();
            TopologyNode calledTN = null;
            if (topologyNodeHashtable.containsKey(calledMethodKey)) {
                calledTN = topologyNodeHashtable.get(calledMethodKey);
//                calledTN.increaseCalledCount();
            } else {
                AbstractMap.SimpleEntry<Node, Node> parentAndChild = null;
                for (Node _node : HandleJBC.getAllNodesSet().get(hash)) {
                    if (parentAndChild != null)
                        break;
                    parentAndChild = _node.findParentAndChild(calledMethodName, calledMethod.getSignature());
                }
                JBCClass findedJBCClass = (JBCClass) parentAndChild.getKey();
                JBCMethod findedJBCMethod = (JBCMethod) parentAndChild.getValue();

                calledTN = new TopologyNode(findedJBCMethod, filterAccessModifier(findedJBCMethod.getAccessModifier(), findedJBCMethod, findedJBCClass));
                topologyNodeHashtable.put(calledTN.getKey(), calledTN);
            }
            mainTopologyNode.getOutgoing().add(calledMethodKey);
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
