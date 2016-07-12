package model;

import java.util.ArrayList;

/**
 * Created by LimSJ on 2016-07-06.
 */
public class JBCMethod {
    private String inAnyClass;
    private String methodName;
    private String accessModifier;
    private String returnType;
    private ArrayList<String> parameters = new ArrayList<String>();
    private int calledCount;
    private ArrayList<String> calledMethods = new ArrayList<String>();

    public JBCMethod(String inAnyClass, String methodName) {
        this.inAnyClass = inAnyClass;
        this.methodName = methodName;
        this.calledCount = 0;
    }

    public String getInAnyClass() {
        return inAnyClass;
    }

    public void setInAnyClass(String inAnyClass) {
        this.inAnyClass = inAnyClass;
    }

    public String getMethodName() {
        return methodName;
    }

    public void setMethodName(String methodName) {
        this.methodName = methodName;
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

    public int getCalledCount() {
        return calledCount;
    }

    public void setCalledCount(int calledCount) {
        this.calledCount = calledCount;
    }

    public ArrayList<String> getParameters() {
        return parameters;
    }

    public ArrayList<String> getCalledMethods() {
        return calledMethods;
    }
}
