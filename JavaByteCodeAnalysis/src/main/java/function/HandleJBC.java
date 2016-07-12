package function;

import javassist.*;
import javassist.expr.ExprEditor;
import javassist.expr.MethodCall;
import org.apache.log4j.Logger;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.Hashtable;
import java.util.StringTokenizer;

/**
 * Created by LimSJ on 2016-07-08.
 */
public class HandleJBC {

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
        boolean isArr = false;

        int index = 0;
        if(isMethod){
            index = desc.indexOf(")") + 1;
        }

        if(desc.charAt(index) == '['){
            index++;
            isArr = true;
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
        if(isArr)
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
            String str = desc.substring(start, end-1);
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

    public static ArrayList<String> getMethodParameters(CtClass[] ctClasses){
        ArrayList<String> params = new ArrayList<>();

        for(CtClass ctClass : ctClasses){
            params.add(ctClass.getName().toString());
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
            int length = 1;

            if(token.charAt(start) == '[')
                length++;

            char t = token.charAt(start + length - 1);
            if(t != 'L'){ // 클래스가 아닌 경우
                tokens.add(token.substring(start, start + length));
                start += length;
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
                            // TODO: 2016-07-11 calledCount 어떻게 조작하지?
                            // jar랑 package이름 알아내가지고 calledCount 세자!
                            String methodName = m.getClassName() + "." + m.getMethodName();
                            methods.add(methodName);

                            

                            //System.err.println(m.getMethod().getDeclaringClass().getPackageName()); // 패키지네임
                            //
                            //System.err.println(m.getClass().getProtectionDomain().getCodeSource().getLocation()); // javassist.jar로 나옴
                            //System.err.println(ct.getClass().getProtectionDomain().getCodeSource().getLocation()); // javassist.jar
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
}
