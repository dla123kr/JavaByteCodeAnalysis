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
        main.setDepth(0);
        topologyNodeHashtable.put(main.getKey(), main);

        // 중심지의 클래스를 부르는 수를 셈
        if (!relation.equals("Outgoing")) {
            // Both, Ingoing
            if (detail.equals("Methods")) {
                connectIngoingEdgeFromMethodsToCenter(topologyNodeHashtable, nodes, name, mainType);
            } else if (detail.equals("Classes")) {
                connectIngoingEdgeFromNotMethodsToCenter(topologyNodeHashtable, nodes, name, null, mainType, NodeType.CLASS);
            } else {
                connectIngoingEdgeFromNotMethodsToCenter(topologyNodeHashtable, nodes, name, null, mainType, NodeType.PACKAGE);
            }
        }

        // 내가 부르는 애들을 셈
        if (!relation.equals("Ingoing")) {
            // Both, Outgoing
            if (detail.equals("Methods")) {
                if (mainType.equals("main_class")) {
                    connectOutgoingEdgeFromClassToMethods(topologyNodeHashtable, mainNode, main, hash, 0, depth);
                } else if (mainType.equals("main_method")) {
                    connectOutgoingEdgeFromMethodToMethods(topologyNodeHashtable, (JBCMethod) mainNode, main, "main_method", main, "method", hash, 0, depth);
                }
            } else if (detail.equals("Classes")) {
                if (mainType.equals("main_class")) {
                    connectOutgoingEdgeFromNotMethodToNotMethods(topologyNodeHashtable, mainNode, main, "main_class", main, "class", NodeType.CLASS, hash, 0, depth);
                } else if (mainType.equals("main_method")) {
                    connectOutgoingEdgeFromMethodToNotMethods(topologyNodeHashtable, (JBCMethod) mainNode, main, "main_method", main, "method", NodeType.CLASS, hash, 0, depth);
                }
            } else {
                if (mainType.equals("main_class")) {
                    connectOutgoingEdgeFromNotMethodToNotMethods(topologyNodeHashtable, mainNode, main, "main_class", main, "class", NodeType.PACKAGE, hash, 0, depth);
                } else if (mainType.equals("main_method")) {
                    connectOutgoingEdgeFromMethodToNotMethods(topologyNodeHashtable, (JBCMethod) mainNode, main, "main_method", main, "method", NodeType.PACKAGE, hash, 0, depth);
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
    private void connectIngoingEdgeFromNotMethodsToCenter(Hashtable<String, TopologyNode> topologyNodeHashtable, ArrayList<Node> nodes, String name, Node parent, String mainType, int detailType) {
        for (Node node : nodes) {
            Node param = null;
            if (node.getType().equals("Package")) {
                param = detailType == NodeType.PACKAGE ? node : null;
                connectIngoingEdgeFromNotMethodsToCenter(topologyNodeHashtable, node.getChildren(), name, param, mainType, detailType);
            } else if (node.getType().equals("Class")) {
                param = detailType == NodeType.PACKAGE ? parent : node;
                connectIngoingEdgeFromNotMethodsToCenter(topologyNodeHashtable, node.getChildren(), name, param, mainType, detailType);
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

    private void connectIngoingEdgeFromMethodsToCenter(Hashtable<String, TopologyNode> topologyNodeHashtable, ArrayList<Node> nodes, String name, String mainType) {
        for (Node node : nodes) {
            if (node.getType().equals("Package") || node.getType().equals("Class")) {
                connectIngoingEdgeFromMethodsToCenter(topologyNodeHashtable, node.getChildren(), name, mainType);
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

    /**
     * @param topologyNodeHashtable
     * @param mainNode
     * @param rootTopologyNode
     * @param rootType              루트의 타입 (main_class 혹은 main_method)
     * @param startTopologyNode
     * @param startType             시작점의 타입 (class, package)
     * @param detailType            리프의 타입 (NodeType.PACKAGE 혹은 NodeType.CLASS)
     * @param hash
     * @param curDepth
     * @param endDepth
     */
    private void connectOutgoingEdgeFromNotMethodToNotMethods(Hashtable<String, TopologyNode> topologyNodeHashtable, Node mainNode, TopologyNode rootTopologyNode, String rootType, TopologyNode startTopologyNode, String startType, int detailType, String hash, int curDepth, int endDepth) {
        if (mainNode == null)
            return;

        if (mainNode.getType().equals("Class")) {
            for (Node node : mainNode.getChildren()) {
                if (node.getType().equals("Method")) {
                    JBCMethod jbcMethod = (JBCMethod) node; // 내 함수
                    connectOutgoingEdgeFromMethodToNotMethods(topologyNodeHashtable, jbcMethod, rootTopologyNode, rootType, startTopologyNode, startType, detailType, hash, curDepth, endDepth);
                }
            }
        } else {
            for (Node node : mainNode.getChildren()) {
                connectOutgoingEdgeFromNotMethodToNotMethods(topologyNodeHashtable, node, rootTopologyNode, rootType, startTopologyNode, startType, detailType, hash, curDepth, endDepth);
            }
        }
    }

    private void connectOutgoingEdgeFromMethodToNotMethods(Hashtable<String, TopologyNode> topologyNodeHashtable, JBCMethod jbcMethod, TopologyNode rootTopologyNode, String rootType, TopologyNode startTopologyNode, String startType, int detailType, String hash, int curDepth, int endDepth) {
        if (curDepth == endDepth)
            return;

        for (CalledMethod calledMethod : jbcMethod.getCalledMethods()) {
            String calledMethodName = calledMethod.getName();
            String[] splt = calledMethodName.split("\\.");

            // 루트 혹은 스타트와 관련있으면 패스 (Ingoing이랑 겹치는거 방지)
            String chkRootKey = null, chkStartKey = null;
            if (rootType.equals("main_class")) {
                chkRootKey = calledMethodName.substring(0, calledMethodName.length() - (splt[splt.length - 1].length() + 1));
            } else if (rootType.equals("main_method")) {
                chkRootKey = calledMethod.getName() + "#" + calledMethod.getSignature();
            }
            if (startType.equals("package")) {
                if (splt.length > 2)
                    chkStartKey = calledMethodName.substring(0, calledMethodName.length() - (splt[splt.length - 1].length() + splt[splt.length - 2].length() + 2));
                else
                    chkStartKey = "(default)";
            } else if (startType.equals("class")) {
                chkStartKey = calledMethodName.substring(0, calledMethodName.length() - (splt[splt.length - 1].length() + 1));
            } else if (startType.equals("method")) {
                chkStartKey = calledMethod.getName() + "#" + calledMethod.getSignature();
            }
            if (chkRootKey.equals(rootTopologyNode.getKey()) || chkStartKey.equals(startTopologyNode.getKey())) {
                continue;
            }

            if (detailType == NodeType.PACKAGE) {
                splt = chkStartKey.split("\\.");
                if (startType.equals("class")) {
                    chkStartKey = chkStartKey.substring(0, chkStartKey.length() - (splt[splt.length - 1].length() + 1)); // Class이름 제외하고 Package만 뽑아냄
                } else if (startType.equals("method")) {
                    if (splt.length > 2)
                        chkStartKey = chkStartKey.substring(0, chkStartKey.length() - (splt[splt.length - 1].length() + splt[splt.length - 2].length() + 2)); // Method, Class이름 제외하고 Package만 뽑아냄
                    else
                        chkStartKey = "(default)";
                }
            } else if (detailType == NodeType.CLASS) {
                splt = chkStartKey.split("\\.");
                if (startType.equals("method")) {
                    chkStartKey = chkStartKey.substring(0, chkStartKey.length() - (splt[splt.length - 1].length() + 1)); // Method이름 제외하고 Class만 뽑아냄
                }
            }

            TopologyNode calledTN = null;
            if (topologyNodeHashtable.containsKey(chkStartKey)) {
                calledTN = topologyNodeHashtable.get(chkStartKey);
                if (calledTN.getDepth() < curDepth + 1)
                    calledTN.setDepth(curDepth + 1);
                // calledTN.increaseCalledCount();
            } else {
                Node findedNode = null;
                for (Node _node : HandleJBC.getAllNodesSet().get(hash)) {
                    if (findedNode != null)
                        break;
                    findedNode = _node.findChild(chkStartKey);
                }

                String type = detailType == NodeType.PACKAGE ? "package" : "class";
                calledTN = new TopologyNode(findedNode, type);
                calledTN.setDepth(curDepth + 1);
                topologyNodeHashtable.put(calledTN.getKey(), calledTN);

                // TODO: 2016-08-09 추가 depth 진행
                connectOutgoingEdgeFromNotMethodToNotMethods(topologyNodeHashtable, findedNode, rootTopologyNode, rootType, calledTN, type, detailType, hash, curDepth + 1, endDepth);
            }
            startTopologyNode.getOutgoing().add(chkStartKey);
            calledTN.setIsOnlyIngoing(false);
        }
    }

    private void connectOutgoingEdgeFromClassToMethods(Hashtable<String, TopologyNode> topologyNodeHashtable, Node mainNode, TopologyNode startTopologyNode, String hash, int curDepth, int endDepth) {
        for (Node node : mainNode.getChildren()) {
            if (node.getType().equals("Method")) {
                JBCMethod jbcMethod = (JBCMethod) node; // 내 함수
                connectOutgoingEdgeFromMethodToMethods(topologyNodeHashtable, jbcMethod, startTopologyNode, "main_class", startTopologyNode, "class", hash, curDepth, endDepth);
            }
        }
    }

    private void connectOutgoingEdgeFromMethodToMethods(Hashtable<String, TopologyNode> topologyNodeHashtable, JBCMethod jbcMethod, TopologyNode rootTopologyNode, String rootType, TopologyNode startTopologyNode, String startType, String hash, int curDepth, int endDepth) {
        if (curDepth == endDepth)
            return;

        for (CalledMethod calledMethod : jbcMethod.getCalledMethods()) {
            String calledMethodName = calledMethod.getName();
            String[] splt = calledMethodName.split("\\.");

            // 루트 혹은 스타트와 관련있으면 패스 (Ingoing이랑 겹치는거 방지)
            String chkRootKey = null, chkStartKey = null;
            if (rootType.equals("main_class")) {
                chkRootKey = calledMethodName.substring(0, calledMethodName.length() - (splt[splt.length - 1].length() + 1)); // 클래스 이름
            } else if (rootType.equals("main_method")) {
                chkRootKey = calledMethod.getName() + "#" + calledMethod.getSignature(); // 함수 이름
            }
            if (startType.equals("class")) {
                chkStartKey = calledMethodName.substring(0, calledMethodName.length() - (splt[splt.length - 1].length() + 1)); // 클래스 이름
            } else if (startType.equals("method")) {
                chkStartKey = calledMethod.getName() + "#" + calledMethod.getSignature(); // 함수 이름
            }
            if (chkRootKey.equals(rootTopologyNode.getKey()) || chkStartKey.equals(startTopologyNode.getKey())) {
                continue;
            }

            String calledMethodKey = calledMethodName + "#" + calledMethod.getSignature();
            TopologyNode calledTN = null;
            if (topologyNodeHashtable.containsKey(calledMethodKey)) {
                calledTN = topologyNodeHashtable.get(calledMethodKey);
                if (calledTN.getDepth() < curDepth + 1)
                    calledTN.setDepth(curDepth + 1);
//                calledTN.increaseCalledCount();

                // TODO: 2016-08-08 이미 있을 땐 어떡하지 ?
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
                calledTN.setDepth(curDepth + 1);
                topologyNodeHashtable.put(calledTN.getKey(), calledTN);

                // TODO: 2016-08-08 추가 depth 진행?????
                connectOutgoingEdgeFromMethodToMethods(topologyNodeHashtable, findedJBCMethod, rootTopologyNode, rootType, calledTN, "method", hash, curDepth + 1, endDepth);
            }
            startTopologyNode.getOutgoing().add(calledMethodKey);
            calledTN.setIsOnlyIngoing(false);
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
