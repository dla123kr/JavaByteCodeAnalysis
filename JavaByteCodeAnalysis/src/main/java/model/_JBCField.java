package model;

import util.NodeType;

/**
 * Created by LimSJ on 2016-07-19.
 */
public class _JBCField extends Node {

    public _JBCField(String name, Node parent) {
        super(name);
        this.setType(NodeType.FIELD);

        this.setParent(parent);
        if (parent != null)
            parent.getChildren().add(this);
    }


}
