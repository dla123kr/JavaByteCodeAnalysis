package model;

/**
 * Created by LimSJ on 2016-07-29.
 */
public class CalledMethod {

    private String name;
    private String signature;

    public CalledMethod(String name, String signature) {
        this.name = name;
        this.signature = signature;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSignature() {
        return signature;
    }

    public void setSignature(String signature) {
        this.signature = signature;
    }
}
