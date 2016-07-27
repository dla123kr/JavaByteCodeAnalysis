package model;

import util.NodeType;

public class JBCField extends Node {

    public JBCField(String name, Node parent) {
        super(name);
        this.setType(NodeType.FIELD);

        this.setParent(parent);
        if (parent != null)
            parent.getChildren().add(this);
    }


}
