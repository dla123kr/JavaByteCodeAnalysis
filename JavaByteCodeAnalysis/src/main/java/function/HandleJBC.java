package function;

import javassist.*;
import javassist.bytecode.ClassFile;
import model.*;
import org.apache.log4j.Logger;

import java.util.*;

public class HandleJBC {

    private static final Logger log = Logger.getLogger(HandleJBC.class);
    public ArrayList<CalledMethod> tmpCalledMethods = new ArrayList<>();

    private ArrayList<Node> staticNodes = new ArrayList<>();
    private static Hashtable<String, ArrayList<Node>> allNodesSet = new Hashtable<>();
    private static Hashtable<String, ArrayList<Filter>> allFiltersSet = new Hashtable<>();

    public ArrayList<Node> getStaticNodes() {
        return staticNodes;
    }

    public static Hashtable<String, ArrayList<Node>> getAllNodesSet() {
        return allNodesSet;
    }

    public static Hashtable<String, ArrayList<Filter>> getAllFiltersSet() {
        return allFiltersSet;
    }

    /**
     * ClassFile을 분석하여 필요한 형태(JBCClass, JBCField, JBCMethod)로 가공한다.
     *
     * @param classFile 가공할 Class File
     */
    public void addNode(ClassFile classFile) {
        ClassPool classPool = ClassPool.getDefault();

        CtClass ctClass = classPool.makeClass(classFile);
        CtField[] ctFields = ctClass.getDeclaredFields();
        CtConstructor[] ctConstructors = ctClass.getDeclaredConstructors();
        CtMethod[] ctMethods = ctClass.getDeclaredMethods();

        JBCClass jbcClass = new JBCClass(this, ctClass.getSimpleName(), ctClass.getPackageName());
        jbcClass.setIsLoaded(true);
        jbcClass.setSuperClassName(classFile.getSuperclass());
        Collections.addAll(jbcClass.getInterfaceNames(), classFile.getInterfaces());

        for (CtField ctField : ctFields) {
            JBCField jbcField = new JBCField(ctField.getName(), jbcClass);

            jbcField.setAccessModifier(ctField.getModifiers());
            jbcField.setReturnType(ctField.getSignature(), false);
        }

        for (CtConstructor ctConstructor : ctConstructors) {
            JBCMethod jbcMethod = new JBCMethod(this, ctConstructor.getName(), jbcClass);

            jbcMethod.setAccessModifier(ctConstructor.getModifiers());

            jbcMethod.setParameters(ctConstructor.getSignature());
            jbcMethod.setCalledMethods(ctConstructor);
        }

        for (CtMethod ctMethod : ctMethods) {
            JBCMethod jbcMethod = new JBCMethod(this, ctMethod.getName(), jbcClass);

            jbcMethod.setAccessModifier(ctMethod.getModifiers());
            jbcMethod.setReturnType(ctMethod.getSignature(), true);

            jbcMethod.setParameters(ctMethod.getSignature());
            jbcMethod.setCalledMethods(ctMethod);
        }
    }

    /**
     * 해당 함수를 찾으며 calledCount를 올린다.
     *
     * @param indexes      함수의 full name (점점 잘려나감)
     * @param parent       자식을 탐색할 부모
     * @param calledMethod 찾을 함수
     */
    private void recursiveFindMethod(String indexes, Node parent, CalledMethod calledMethod) {
        String[] splitted = indexes.split("\\.");

        if (splitted.length == 1) {
            // 함수 찾자
            String name = splitted[0];

            JBCMethod jbcMethod = null;
            for (int i = 0; i < parent.getChildren().size(); i++) {
                if (name.equals(parent.getChildren().get(i).getName()) && parent.getChildren().get(i).getType().equals("Method")) {
                    jbcMethod = (JBCMethod) parent.getChildren().get(i);
                    if (jbcMethod.getSignature().equals(calledMethod.getSignature())) {
                        jbcMethod.setCalledCount(jbcMethod.getCalledCount() + 1);
                        return;
                    }
                }
            }

            // 못 찾음
            jbcMethod = new JBCMethod(this, name, parent);
            jbcMethod.setCalledCount(1);
            jbcMethod.setSignature(calledMethod.getSignature());
            jbcMethod.setReturnType(calledMethod.getSignature(), true);
            jbcMethod.setParameters(calledMethod.getSignature());
        } else if (splitted.length == 2) {
            // 클래스 찾자
            String className = splitted[0];
            String methodName = splitted[1];

            JBCClass jbcClass = null;
            for (int i = 0; i < parent.getChildren().size(); i++) {
                if (className.equals(parent.getChildren().get(i).getName()) && parent.getChildren().get(i).getType().equals("Class")) {
                    jbcClass = (JBCClass) parent.getChildren().get(i);
                    recursiveFindMethod(indexes.substring(className.length() + 1), jbcClass, calledMethod);
                    return;
                }
            }

            // 못 찾음
            if (parent.getName().equals("(default)"))
                jbcClass = new JBCClass(this, className, (String) null);
            else
                jbcClass = new JBCClass(className, parent);
            JBCMethod jbcMethod = new JBCMethod(this, methodName, jbcClass);
            jbcMethod.setCalledCount(1);
            jbcMethod.setSignature(calledMethod.getSignature());
            jbcMethod.setReturnType(calledMethod.getSignature(), true);
            jbcMethod.setParameters(calledMethod.getSignature());
        } else {
            // 패키지 찾자
            String packName = splitted[0];
            for (int i = 0; i < parent.getChildren().size(); i++) {
                if (packName.equals(parent.getChildren().get(i).getName()) && parent.getChildren().get(i).getType().equals("Package")) {
                    Node packNode = parent.getChildren().get(i);
                    recursiveFindMethod(indexes.substring(packName.length() + 1), packNode, calledMethod);
                    return;
                }
            }

            // 못찾음
            Node newPackage = new Node(packName);
            newPackage.setParent(parent);
            parent.getChildren().add(newPackage);
            recursiveFindMethod(indexes.substring(packName.length() + 1), newPackage, calledMethod);
        }
    }

    /**
     * 함수 calledCount를 센다.
     */
    public void countingMethodCall() {
        for (CalledMethod calledMethod : tmpCalledMethods) {
            String str = calledMethod.getName();
            String[] splitted = str.split("\\."); // 패키지.패키지.패키지.클래스.함수이름

            // splitted Length가 3보다 작으면 default로 (왜냐면 패키지없이 클래스이름.함수이름 이니깐)
            // splitted가 2면 클래스 찾고, 1이면 함수 찾는다
            Node callingNode = null;
            if (splitted.length < 3) {
                callingNode = getStaticNodes().get(0); // (default)
                recursiveFindMethod(str, callingNode, calledMethod);
            } else {
                boolean isFind = false;
                for (int i = 1; i < getStaticNodes().size(); i++) {
                    if (splitted[0].equals(getStaticNodes().get(i).getName()) && getStaticNodes().get(i).getType().equals("Package")) {
                        callingNode = getStaticNodes().get(i);
                        isFind = true;
                        break;
                    }
                }
                if (!isFind) {
                    // 못 찾았으니 만들자
                    Node newPackage = new Node(splitted[0]);
                    getStaticNodes().add(newPackage);
                    callingNode = newPackage;
                }

                recursiveFindMethod(str.substring(splitted[0].length() + 1), callingNode, calledMethod);
            }
        }

        // call된 함수 다 처리했으니 tmp 비워주기
        tmpCalledMethods.clear();
    }
}
