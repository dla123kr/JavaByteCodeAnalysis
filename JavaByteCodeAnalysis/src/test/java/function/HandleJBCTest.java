package function;

import javassist.bytecode.ClassFile;
import model.JBCClass;
import model.Node;
import org.junit.Assert;
import org.junit.Test;

import java.io.BufferedInputStream;
import java.io.DataInputStream;
import java.io.FileInputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

/**
 * Created by LimSJ on 2016-07-25.
 */
public class HandleJBCTest {

    private int cnt = 0;
    private String str;

    /**
     * 해당 파일을 테스트 (*.jar)
     *
     * @throws Exception
     */
    @Test
    public void addNodeTest() throws Exception {
        HandleJBC handleJBC = new HandleJBC();
        handleJBC.getStaticNodes().add(new Node("(default)"));

        BufferedInputStream bis = null;
        ClassFile classFile = null;

        bis = new BufferedInputStream(new FileInputStream("D:\\[자료]\\jennifer\\jennifer-server-5.1.0.5\\jennifer-data-server-5.1.0.5\\server.data\\lib\\com.jennifersoft.data-5.1.0.5.jar")); // TODO: 2016-07-25 변경
        ZipInputStream zis = new ZipInputStream(bis);
        for (ZipEntry entry = zis.getNextEntry(); entry != null; entry = zis.getNextEntry()) {
            if (!entry.isDirectory() && entry.getName().toLowerCase().endsWith(".class")) {
                String className = entry.getName().replace('/', '.');
                classFile = new ClassFile(new DataInputStream(zis));
                handleJBC.addNode(classFile);
            }
        }
        handleJBC.countingMethodCall();

        // 테스트
        classFileCountTest(handleJBC, "com", new String[]{"jennifersoft", "data", "command", "agentinfo"}, 15);
        classFileCountTest(handleJBC, "com", new String[]{"jennifersoft", "data", "db", "migration"}, 10);
        classFileCountTest(handleJBC, "com", new String[]{"jennifersoft", "e"}, 7);
        classFileCountTest(handleJBC, "com", new String[]{"jennifersoft", "data", "useragent", "parser"}, 34);
        classFileCountTest(handleJBC, "com", new String[]{"jennifersoft", "data"}, 66);
        classFileCountTest(handleJBC, "org", new String[]{"json"}, 20);
        classFileCountTest(handleJBC, "jennifer", new String[]{"annotaion"}, 2);
        classFileCountTest(handleJBC, "jennifer", new String[]{"core"}, 35);
        classFileCountTest(handleJBC, "jennifer", new String[]{"core", "field"}, 29);
        classFileCountTest(handleJBC, "jennifer", new String[]{"lang", "util"}, 1);
        classFileCountTest(handleJBC, "jennifer", new String[]{"lang", "record"}, 44);
        classFileCountTest(handleJBC, "jennifer", new String[]{"version"}, 4);
        classFileCountTest(handleJBC, "jennifer", new String[]{"net", "packet"}, 3);

        checkParentTest(handleJBC, "com", new String[]{"jennifersoft"}, "com");
        checkParentTest(handleJBC, "com", new String[]{"jennifersoft", "b"}, "jennifersoft");
        checkParentTest(handleJBC, "com", new String[]{"jennifersoft", "data", "cache"}, "data");
        checkParentTest(handleJBC, "com", new String[]{"jennifersoft", "data", "cache", "CachedLong"}, "cache");
        checkParentTest(handleJBC, "org", new String[]{"json"}, "org");
        checkParentTest(handleJBC, "org", new String[]{"json", "JSONString"}, "json");
    }

    /**
     * 해당 경로의 실제로 존재하는(isLoaded) 클래스 파일의 수를 셈
     *
     * @param start    시작 경로
     * @param paths    나머지 경로
     * @param expected 기대값
     */
    private void classFileCountTest(HandleJBC handleJBC, String start, String[] paths, int expected) {
        cnt = 0;
        ArrayList<String> packs = new ArrayList<>(Arrays.asList(paths));
        for (int i = 1; i < handleJBC.getStaticNodes().size(); i++) {
            if (handleJBC.getStaticNodes().get(i).getName().equals(start)) {
                recursiveClassFileCount(handleJBC.getStaticNodes().get(i), packs);
                break;
            }
        }
        Assert.assertEquals(expected, cnt);
    }

    private void recursiveClassFileCount(Node node, ArrayList<String> packs) {
        if (packs.size() == 0) {
            for (int i = 0; i < node.getClasses().size(); i++) {
                if (((JBCClass) node.getClasses().get(i)).getIsLoaded())
                    cnt++;
            }
        } else {
            for (int i = 0; i < node.getPackages().size(); i++) {
                if (node.getPackages().get(i).getName().equals(packs.get(0))) {
                    packs.remove(0);
                    recursiveClassFileCount(node.getPackages().get(i), packs);
                    break;
                }
            }
        }
    }

    /**
     * 해당 경로의 부모이름을 테스트
     *
     * @param start    시작 경로
     * @param paths    나머지 경로
     * @param expected 기대값
     */
    private void checkParentTest(HandleJBC handleJBC, String start, String[] paths, String expected) {
        str = "";
        ArrayList<String> packs = new ArrayList<>(Arrays.asList(paths));
        for (int i = 1; i < handleJBC.getStaticNodes().size(); i++) {
            if (handleJBC.getStaticNodes().get(i).getName().equals(start)) {
                recursiveCheckParent(handleJBC.getStaticNodes().get(i), packs);
                break;
            }
        }
        Assert.assertEquals(expected, str);
    }

    private void recursiveCheckParent(Node node, ArrayList<String> packs) {
        if (packs.size() == 1) {
            // 클래스이름이나 패키지이름
            for (int i = 0; i < node.getChildren().size(); i++) {
                if (node.getChildren().get(i).getName().equals(packs.get(0))) {
                    str = node.getChildren().get(i).getParentName();
                }
            }
        } else {
            for (int i = 0; i < node.getPackages().size(); i++) {
                if (node.getPackages().get(i).getName().equals(packs.get(0))) {
                    packs.remove(0);
                    recursiveCheckParent(node.getPackages().get(i), packs);
                    break;
                }
            }
        }
    }
}
