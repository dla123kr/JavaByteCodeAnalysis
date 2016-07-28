package model;

import java.util.ArrayList;

public class TopologyNode {
    private String key;
    private String name;
    private String type;
    private int calledCount;
    private ArrayList<String> outgoing = new ArrayList<>();

    public TopologyNode(String key, String type) {
        this.key = key;
        String[] splitted = key.split("\\.");
        this.name = splitted[splitted.length - 1];
        this.type = type;

        this.calledCount = 0;
    }

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
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

    public ArrayList<String> getOutgoing() {
        return outgoing;
    }
}
