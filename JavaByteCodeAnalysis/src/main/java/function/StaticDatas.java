package function;

import model.JBCClass;

import java.util.Hashtable;

/**
 * Created by LimSJ on 2016-07-13.
 */
public class StaticDatas {

    private static Hashtable<String, JBCClass> jbcClassHashtable = null;

    /**
     * 백엔드에서 다룰 모든 JBCClass를 가지고 있다.
     * Key는 '패키지이름.클래스이름'
     * Value는 그에 해당하는 JBCClass
     * 이는 Topology를 그릴 때 사용할 것이다.
     * @return 백엔드에서 가지고 있는 모든 JBCClass를 불러옴
     */
    public static Hashtable<String, JBCClass> getJBCClassHashtable() {
        if(jbcClassHashtable == null)
            jbcClassHashtable = new Hashtable<>();

        return jbcClassHashtable;
    }
}
