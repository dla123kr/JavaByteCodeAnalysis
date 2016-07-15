package function;

import javassist.*;
import javassist.expr.ExprEditor;
import javassist.expr.MethodCall;
import model.JBCClass;
import model.JBCMethod;
import org.apache.log4j.Logger;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.Hashtable;
import java.util.StringTokenizer;

/**
 * Created by LimSJ on 2016-07-08.
 */
public class HandleJBC {

    private static ArrayList<String> tmpCalledMethods = new ArrayList<>();

    /**
     * 입력받은 flag를 통해 접근제어자를 반환
     * @param flag Modifier flag
     * @return 접근제어자
     */
    public static String getModifier(int flag){
        String accessModifier = "";

        if(Modifier.isPublic(flag))
            accessModifier += "public ";
        else if(Modifier.isPrivate(flag))
            accessModifier += "private ";
        else if(Modifier.isProtected(flag))
            accessModifier += "protected ";

        if(Modifier.isStatic(flag))
            accessModifier += "static";
        if(Modifier.isFinal(flag))
            accessModifier += "final";
        // TODO: 2016-07-08 abstract랑 interface는 어떻게 할꺼야 ?
        return accessModifier;
    }

    /**
     * Descriptor를 보고 반환타입을 분석
     * @param desc Descriptor
     * @param isMethod 함수면 true, 필드면 false
     * @return 반환타입
     */
    private static String getReturnType(String desc, boolean isMethod){
        String type = "";
        int arrDimension = 0;

        int index = 0;
        if(isMethod){
            index = desc.indexOf(")") + 1;
        }

        while(desc.charAt(index) == '['){
            index++;
            arrDimension++;
        }

        if(desc.charAt(index) == 'L'){
            type = desc.substring(index + 1).replace("/", ".");
        } else {
            switch(desc.charAt(index)){
                case 'B':
                    type = "byte";
                    break;
                case 'C':
                    type = "char";
                    break;
                case 'D':
                    type = "double";
                    break;
                case 'F':
                    type = "float";
                    break;
                case 'I':
                    type = "int";
                    break;
                case 'J':
                    type = "long";
                    break;
                case 'S':
                    type = "short";
                    break;
                case 'Z':
                    type = "boolean";
                    break;
                case 'V':
                    type = "void";
                    break;
            }
        }

        if(type.charAt(type.length() - 1) == ';')
            type = type.substring(0, type.length() - 1);
        if(arrDimension-- > 0)
            type += "[]";

        return type;
    }

    /**
     * 필드 반환타입을 가져온다
     * @param desc Field Descriptor
     * @return 필드 반환타입
     */
    public static String getFieldReturnType(String desc){
        return getReturnType(desc, false);
    }

    /**
     * 함수 반환타입을 가져온다
     * @param desc Method Descriptor
     * @return 함수 반환타입
     */
    public static String getMethodReturnType(String desc){
        return getReturnType(desc, true);
    }

    /**
     * Method의 Descriptor를 받아 파라미터가 뭐뭐있는지 반환
     * @param desc Method Descriptor
     * @return 파라미터 종류가 담긴 ArrayList를 반환
     */
    public static ArrayList<String> getMethodParameters(String desc){
        ArrayList<String> params = null;
        StringTokenizer tokens = null;

        int start = desc.indexOf("(") + 1;
        int end = desc.indexOf(")");

        if(start < end){
            String str = desc.substring(start, end);
            tokens = new StringTokenizer(str, ";");
        }
        if(tokens == null || !tokens.hasMoreElements())
            return null;

        params = new ArrayList<>();
        while(tokens.hasMoreElements()){
            String token = tokens.nextToken();
            ArrayList<String> oneMore = getMultipleToken(token);

            for(String realToken : oneMore){
                String param = getFieldReturnType(realToken);
                params.add(param);
            }
        }
        return params;
    }

    /**
     * 한 토큰 내에 여러개의 파라미터가 존재할 수 있으니 잘라냄
     * @param token Descriptor의 조각
     * @return Descriptor를 더 잘게 조각냄
     */
    private static ArrayList<String> getMultipleToken(String token){
        ArrayList<String> tokens = new ArrayList<>();

        int start = 0;
        int end = token.length();

        while(start < end){
            String type = "";
            int arrDimension = 0;

            while(token.charAt(start + arrDimension) == '[')
                arrDimension++;

            char t = token.charAt(start + arrDimension);
            if(t != 'L'){ // 클래스가 아닌 경우
                tokens.add(token.substring(start, start + arrDimension + 1));
                start += arrDimension + 1;
            } else{ // 클래스인 경우
                tokens.add(token.substring(start, end));
                break;
            }
        }

        return tokens;
    }

    public static ArrayList<String> getCalledMethods(CtBehavior ct){
        ArrayList<String> methods = new ArrayList<>();
        try {
            ct.instrument(
                    new ExprEditor(){
                        @Override
                        public void edit(MethodCall m){
                            String methodName = m.getClassName() + "." + m.getMethodName(); // .으로 쪼개면 패키지정보도 나온다
                            methods.add(methodName);
                            tmpCalledMethods.add(methodName);
                        }
                    }
            );
        } catch (CannotCompileException e) {
            System.err.println("===========================");
            System.err.println("콜된 함수 찾던 도중 에러");
            e.printStackTrace();
        }

        HashSet hs = new HashSet(methods);
        ArrayList<String> notDuplicationMethods = new ArrayList<>(hs);

        return notDuplicationMethods;
    }

    public static void countingMethodCall(ArrayList<JBCClass> jbcClasses){
        for(String str : tmpCalledMethods){
            String[] splitted = str.split("\\.");
            String methodName = splitted[splitted.length - 1];
            String key = str.replace("." + methodName, "");

            /**
             * 해당 value가 unloaded일수도 있고 loaded일수도 있다.
             */
            if(StaticDatas.getJBCClassHashtable().containsKey(key)){
                JBCClass value = StaticDatas.getJBCClassHashtable().get(key);
                for(JBCMethod jm : value.getJBCMethods()){
                    if(jm.getMethodName().equals(methodName)){
                        jm.setCalledCount(jm.getCalledCount() + 1);
                        break;
                    }
                }
            } else{
                splitted = key.split("\\.");
                String className = splitted[splitted.length - 1];
                String packName = key.replace("." + className, "");

                JBCClass newJBCClass = new JBCClass(packName, className);
                newJBCClass.setLoaded(false);

                JBCMethod newJBCMethod = new JBCMethod(className, methodName);
                newJBCMethod.setCalledCount(1);
            }
        }

        // call된 함수 다 처리했으니 tmp 비워주기
        tmpCalledMethods.clear();
    }
}
