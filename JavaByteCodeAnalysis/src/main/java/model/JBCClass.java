package model;

import function.HandleJBC;
import util.NodeType;

import java.util.ArrayList;

public class JBCClass extends Node {

    private boolean isLoaded = false;
    private String superClassName = null;
    private ArrayList<String> interfaceNames = new ArrayList<>();

    public JBCClass(HandleJBC handleJBC, String name, String packName) {
        super(name);
        this.setType(NodeType.CLASS);
        this.isLoaded = false;

        this.setParent(handleJBC, packName);
    }

    public JBCClass(String name, Node parent) {
        super(name);
        this.setType(NodeType.CLASS);
        this.isLoaded = false;

        this.setParent(parent);
        if (parent != null)
            parent.getChildren().add(this);
    }

    public void setIsLoaded(boolean isLoaded) {
        this.isLoaded = isLoaded;
    }

    public boolean getIsLoaded() {
        return isLoaded;
    }

    public String getSuperClassName() {
        return superClassName;
    }

    public void setSuperClassName(String superClassName) {
        this.superClassName = superClassName;
    }

    public ArrayList<String> getInterfaceNames() {
        return interfaceNames;
    }
}
