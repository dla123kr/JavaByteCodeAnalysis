package model;

import java.util.ArrayList;

/**
 * Created by LimSJ on 2016-07-06.
 */
public class JBCClass {
    private boolean isLoaded = false;
    private String inAnyPackage;

    private String className;
    private String superClassName;
    private ArrayList<String> interfaceNames = new ArrayList<String>();

    private ArrayList<JBCField> jbcFields = new ArrayList<JBCField>();
    private ArrayList<JBCMethod> jbcMethods = new ArrayList<JBCMethod>();

    public JBCClass(String inAnyPackage, String className) {
        this.inAnyPackage = inAnyPackage;
        this.className = className;
    }

    public boolean isLoaded() {
        return isLoaded;
    }

    public void setLoaded(boolean loaded) {
        isLoaded = loaded;
    }

    public String getInAnyPackage() {
        return inAnyPackage;
    }

    public void setInAnyPackage(String inAnyPackage) {
        this.inAnyPackage = inAnyPackage;
    }

    public String getClassName() {
        return className;
    }

    public String getClassLongName() {
        String longName = "";
        if(inAnyPackage != null)
            longName += inAnyPackage;
        if(!longName.equals(""))
            longName += ".";
        longName += className;
        return longName;
    }

    public void setClassName(String className) {
        this.className = className;
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

    public ArrayList<JBCField> getJBCFields() {
        return jbcFields;
    }

    public ArrayList<JBCMethod> getJBCMethods() {
        return jbcMethods;
    }


}
