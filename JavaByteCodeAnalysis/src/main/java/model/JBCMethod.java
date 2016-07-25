package model;

import function.HandleJBC;
import javassist.CannotCompileException;
import javassist.CtBehavior;
import javassist.expr.ExprEditor;
import javassist.expr.MethodCall;
import org.apache.log4j.Logger;
import util.NodeType;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.StringTokenizer;

/**
 * Created by LimSJ on 2016-07-19.
 */
public class JBCMethod extends Node {

    private static final Logger log = Logger.getLogger(JBCMethod.class);

    private ArrayList<String> parameters = new ArrayList<>();
    private int calledCount;
    private ArrayList<String> calledMethods = new ArrayList<>();

    public JBCMethod(String name, Node parent) {
        super(name);
        this.setType(NodeType.METHOD);
        this.calledCount = 0;

        this.setParent(parent);
        if (parent != null)
            parent.getChildren().add(this);
    }

    public int getCalledCount() {
        return calledCount;
    }

    public void setCalledCount(int calledCount) {
        this.calledCount = calledCount;
    }

    public ArrayList<String> getCalledMethods() {
        return calledMethods;
    }

    public ArrayList<String> getParameters() {
        return parameters;
    }

    public void setParameters(String desc) {
        parameters.clear();

        StringTokenizer tokenizer = null;

        int start = desc.indexOf("(") + 1;
        int end = desc.indexOf(")");

        if (start < end) {
            String str = desc.substring(start, end);
            tokenizer = new StringTokenizer(str, ";");
        }
        if (tokenizer == null || !tokenizer.hasMoreElements())
            return;

        while (tokenizer.hasMoreElements()) {
            String tokenMass = tokenizer.nextToken();
            ArrayList<String> tokens = splitTokenMass(tokenMass);

            for (String token : tokens) {
                String param = descToReturnType(token, false);
                parameters.add(param);
            }
        }
    }

    private ArrayList<String> splitTokenMass(String tokenMass) {
        ArrayList<String> tokens = new ArrayList<>();

        int start = 0;
        int end = tokenMass.length();

        while (start < end) {
            int arrDimension = 0;

            while (tokenMass.charAt(start + arrDimension) == '[')
                arrDimension++;

            char tokenDesc = tokenMass.charAt(start + arrDimension);
            if (tokenDesc != 'L') { // 클래스가 아닌 경우
                tokens.add(tokenMass.substring(start, start + arrDimension + 1));
                start += arrDimension + 1;
            } else { // 클래스인 경우
                tokens.add(tokenMass.substring(start, end));
                break;
            }
        }

        return tokens;
    }

    public void setCalledMethods(CtBehavior ct) {
        calledMethods.clear();
        ArrayList<String> methods = new ArrayList<>();
        try{
            ct.instrument(
                    new ExprEditor(){
                        @Override
                        public void edit(MethodCall m) {
                            String methodName = m.getClassName() + "." + m.getMethodName();
                            methods.add(methodName);
                            HandleJBC.tmpCalledMethods.add(methodName);
                        }
                    }
            );
        } catch (CannotCompileException e) {
            log.error("콜된 함수 찾던 중 컴파일 에러");
            e.printStackTrace();
        }

        HashSet hs = new HashSet(methods);
        calledMethods.addAll(new ArrayList<>(hs));
    }
}
