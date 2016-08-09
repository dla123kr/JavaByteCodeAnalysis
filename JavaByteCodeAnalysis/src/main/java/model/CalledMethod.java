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

    @Override
    public int hashCode() {
        return (this.name.hashCode() + this.signature.hashCode());
    }

    @Override
    public boolean equals(Object obj) {
        if (obj instanceof CalledMethod) {
            CalledMethod calledMethod = (CalledMethod) obj;
            if (this.getName().equals(calledMethod.getName()) && this.getSignature().equals(calledMethod.getSignature())) {
                return true;
            }
        }
        return false;
    }
}
