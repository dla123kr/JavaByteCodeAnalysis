package model;

import function.HandleJBC;
import javassist.Modifier;
import util.NodeType;

import java.util.ArrayList;

/**
 * Created by LimSJ on 2016-07-19.
 */
public class Node {
    private int type;
    private String parentName = null;
    private ArrayList<Node> children = new ArrayList<>(); // 모든 노드타입 가능
    private String name = null;
    private String accessModifier = null;
    private String returnType = null;

    private Node parent = null;

    public Node(String name) {
        this.setType(NodeType.PACKAGE);
        this.name = name;
    }

    public String getType() {
        String type = null;
        switch (this.type) {
            case NodeType.PACKAGE:
                type = "Package";
                break;
            case NodeType.CLASS:
                type = "Class";
                break;
            case NodeType.METHOD:
                type = "Method";
                break;
            case NodeType.FIELD:
                type = "Field";
                break;
            default:
                type = "undefined";
                break;
        }

        return type;
    }

    public void setType(int type) {
        this.type = type;
    }

    public String getParentName() {
        return parentName;
    }

    /**
     * 자동으로 부모와 자식을 연결해줌
     * @param parentName
     */
    public void setParent(String parentName) {
        // HandleJBC.getStaticNodes()에서 부모 찾자 !
        // 부모쪽에겐 자식 추가, 자식에겐 부모 찾아서 setParent(Node)
        if (parentName == null) {
            HandleJBC.getStaticNodes().get(0).getChildren().add(this); // (default)
        } else {
            String[] packs = parentName.split("\\.");

            Node parent = null;
            ArrayList<Node> nodes = HandleJBC.getStaticNodes();
            boolean isFind;
            for (int i = 0; i < packs.length; i++) {
                isFind = false;
                for (int j = 0; j < nodes.size(); j++) {
                    if (nodes.get(j).getName().equals(packs[i])) {
                        parent = nodes.get(j);
                        nodes = parent.getChildren();

                        isFind = true;
                        break;
                    }
                }
                if (!isFind) {
                    Node node = new Node(packs[i]);
                    node.setParent(parent);
                    nodes.add(node);

                    parent = node;
                    nodes = parent.getChildren();
                }
            }

            this.setParent(parent);
            nodes.add(this);
        }
    }

    /**
     * 직접 사용할 때에는, 부모만 지정해주므로 부모->자식은 따로 연결해줘야함
     * @param parent
     */
    public void setParent(Node parent) {
        if (parent != null) {
            this.parent = parent;
            this.parentName = this.parent.name;
        } else {
            this.parent = null;
            this.parentName = null;
        }
    }

    public ArrayList<Node> getChildren() {
        return children;
    }

    public ArrayList<Node> getPackages() {
        ArrayList<Node> ret = new ArrayList<>();

        for (Node child : children) {
            if (child.getType().equals("Package"))
                ret.add(child);
        }

        return ret;
    }

    public ArrayList<Node> getClasses() {
        ArrayList<Node> ret = new ArrayList<>();

        for (Node child : children) {
            if (child.getType().equals("Class"))
                ret.add(child);
        }

        return ret;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getLongName() {
        String name = this.name;
        Node p = parent;
        while (p != null) {
            name = p.getName() + "." + name;
            p = p.parent;
        }

        return name;
    }

    public String getAccessModifier() {
        return accessModifier;
    }

    public void setAccessModifier(int flag) {
        this.accessModifier = flagToAccessModifier(flag);
    }

    public String flagToAccessModifier(int flag) {
        String modifier = "";

        if (Modifier.isPublic(flag))
            modifier += "public ";
        else if (Modifier.isPrivate(flag))
            modifier += "private ";
        else if (Modifier.isProtected(flag))
            modifier += "protected ";

        if (Modifier.isStatic(flag))
            modifier += "static ";
        if (Modifier.isFinal(flag))
            modifier += "final ";

        return modifier;
    }

    public String getReturnType() {
        return returnType;
    }

    public void setReturnType(String desc, boolean isMethod) {
        this.returnType = descToReturnType(desc, isMethod);
    }

    public String descToReturnType(String desc, boolean isMethod) {
        String returnType = null;
        int arrDimension = 0;

        int index = 0;
        if (isMethod) {
            index = desc.indexOf(")") + 1;
        }

        while (desc.charAt(index) == '[') {
            index++;
            arrDimension++;
        }

        if (desc.charAt(index) == 'L') {
            returnType = desc.substring(index + 1).replace("/", ".");
        } else {
            switch (desc.charAt(index)) {
                case 'B':
                    returnType = "byte";
                    break;
                case 'C':
                    returnType = "char";
                    break;
                case 'D':
                    returnType = "double";
                    break;
                case 'F':
                    returnType = "float";
                    break;
                case 'I':
                    returnType = "int";
                    break;
                case 'J':
                    returnType = "long";
                    break;
                case 'S':
                    returnType = "short";
                    break;
                case 'Z':
                    returnType = "boolean";
                    break;
                case 'V':
                    returnType = "void";
                    break;
            }
        }

        if (returnType.charAt(returnType.length() - 1) == ';')
            returnType = returnType.substring(0, returnType.length() - 1);
        if (arrDimension-- > 0)
            returnType += "[]";

        return returnType;
    }
}
