package model;

import java.util.ArrayList;

public class TopologyNode {
    private String key;
    private String longName;
    private String name;
    private String type;
    private int calledCount;
    private ArrayList<String> outgoing = new ArrayList<>();

    public TopologyNode(Node node, String type) {
        this.key = node.getLongName();
        if (node instanceof JBCMethod)
            this.key += "#" + ((JBCMethod) node).getSignature();
        this.longName = node.getLongName();
        this.name = node.getName();
        this.type = type;

        this.calledCount = 0;
    }

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }

    public String getLongName() {
        return longName;
    }

    public void setLongName(String longName) {
        this.longName = longName;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public int getCalledCount() {
        return calledCount;
    }

    public void setCalledCount(int calledCount) {
        this.calledCount = calledCount;
    }

    public void increaseCalledCount() {
        this.calledCount++;
    }

    public ArrayList<String> getOutgoing() {
        return outgoing;
    }

    public void setOutgoing(ArrayList<String> outgoing) {
        this.outgoing = outgoing;
    }
}
