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

public class JBCMethod extends Node {

    private static final Logger log = Logger.getLogger(JBCMethod.class);

    private HandleJBC handleJBC = null;

    private String signature = null;
    private ArrayList<String> parameters = new ArrayList<>();
    private int calledCount;
    private ArrayList<CalledMethod> calledMethods = new ArrayList<>();

    public JBCMethod(HandleJBC handleJBC, String name, Node parent) {
        super(name);
        this.handleJBC = handleJBC;

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

    public ArrayList<CalledMethod> getCalledMethods() {
        return calledMethods;
    }

    public String getSignature() {
        return signature;
    }

    public void setSignature(String signature) {
        this.signature = signature;
    }

    public ArrayList<String> getParameters() {
        return parameters;
    }

    /**
     * Description을 잘라내며 파라미터들을 분리한다.
     *
     * @param desc 잘라낼 Description
     */
    public void setParameters(String desc) {
        this.signature = desc;
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

    /**
     * 큰 덩어리를 잘게 잘라 진짜 파라미터들로 분리한다
     *
     * @param tokenMass 잘린 큰 덩어리
     * @return 파라미터들의 이름 배열
     */
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

    /**
     * 함수를 실행시켜보며 그 함수가 부르는 함수들의 이름과 시그니쳐를 얻는다.
     *
     * @param ct 실행시킬 함수
     */
    public void setCalledMethods(CtBehavior ct) {
        calledMethods.clear();
        ArrayList<CalledMethod> methods = new ArrayList<>();
        try {
            ct.instrument(
                    new ExprEditor() {
                        @Override
                        public void edit(MethodCall m) {
                            String methodName = m.getClassName() + "." + m.getMethodName();
                            CalledMethod cm = new CalledMethod(methodName, m.getSignature());
                            methods.add(cm);
                            handleJBC.tmpCalledMethods.add(cm);
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
