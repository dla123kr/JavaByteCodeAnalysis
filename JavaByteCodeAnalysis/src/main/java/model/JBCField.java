package model;

/**
 * Created by LimSJ on 2016-07-06.
 */
public class JBCField {
    private String inAnyClass;
    private String fieldName;
    private String accessModifier;
    private String returnType;

    public JBCField(String inAnyClass, String fieldName) {
        this.inAnyClass = inAnyClass;
        this.fieldName = fieldName;
    }

    public String getInAnyClass() {
        return inAnyClass;
    }

    public void setInAnyClass(String inAnyClass) {
        this.inAnyClass = inAnyClass;
    }

    public String getFieldName() {
        return fieldName;
    }

    public void setFieldName(String fieldName) {
        this.fieldName = fieldName;
    }

    public String getAccessModifier() {
        return accessModifier;
    }

    public void setAccessModifier(String accessModifier) {
        this.accessModifier = accessModifier;
    }

    public String getReturnType() {
        return returnType;
    }

    public void setReturnType(String returnType) {
        this.returnType = returnType;
    }
}
