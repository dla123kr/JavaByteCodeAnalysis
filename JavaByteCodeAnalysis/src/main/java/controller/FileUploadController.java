package controller;

import function.HandleJBC;
import javassist.bytecode.*;
import model.Node;
import org.apache.log4j.Logger;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.util.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

@RestController
@CrossOrigin(origins = "http://192.168.0.203:3000")
public class FileUploadController {

    private static Logger log = Logger.getLogger(FileUploadController.class);

    @RequestMapping(path = "/fileUpload", method = RequestMethod.POST)
    public ArrayList<Node> fileUpload(@RequestParam("uploadFile") MultipartFile[] files, @RequestParam("hiddenHash") String hash) {
        HandleJBC handleJBC = new HandleJBC();
        handleJBC.getStaticNodes().add(new Node("(default)"));

        BufferedInputStream bis = null;
        ClassFile classFile = null;

        if (!isOkExtension(files)) {
            log.error("올바르지 않은 파일 확장자 포함");
            return null;
        }

        for (MultipartFile file : files) {

            try {
                bis = new BufferedInputStream(file.getInputStream());
            } catch (IOException e) {
                log.error("올바르지 않은 파일");
                e.printStackTrace();
                return null;
            }

            String fileName = file.getOriginalFilename();
            String ext = null;
            String[] splitted = fileName.split("\\.");
            if (splitted.length > 1)
                ext = splitted[splitted.length - 1].toLowerCase();

            if (ext.equals("class")) {
                try {
                    classFile = new ClassFile(new DataInputStream(bis));
                } catch (IOException e) {
                    log.error("classFile 에러");
                    e.printStackTrace();
                }

                if (classFile != null) {
                    handleJBC.addNode(classFile);
                }
            } else if (ext.equals("jar")) {
                ZipInputStream zis = new ZipInputStream(bis);
                try {
                    for (ZipEntry entry = zis.getNextEntry(); entry != null; entry = zis.getNextEntry()) {
                        if (!entry.isDirectory() && entry.getName().toLowerCase().endsWith(".class")) {
                            String className = entry.getName().replace('/', '.');
                            classFile = new ClassFile(new DataInputStream(zis));
                            handleJBC.addNode(classFile);
                            log.info(className);
                        }
                    }
                } catch (IOException e) {
                    log.error("Zip 내에서의 IOException");
                    e.printStackTrace();
                }
            }
        }

        handleJBC.countingMethodCall();

        log.info("node셋팅 완료, JSON전송 전");
        HandleJBC.getAllNodesSet().put(hash, handleJBC.getStaticNodes());

        return handleJBC.getStaticNodes();
    }

    /**
     * 파일 확장자가 전부 맞는지 확인
     *
     * @param files 전송받은 파일들
     * @return OK 여부
     */
    private boolean isOkExtension(MultipartFile[] files) {
        for (MultipartFile file : files) {
            String fileName = file.getOriginalFilename();
            String[] splittedFileNames = fileName.split("\\.");
            String ext = null;
            if (splittedFileNames.length > 1)
                ext = splittedFileNames[splittedFileNames.length - 1].toLowerCase();

            if (!ext.equals("class") && !ext.equals("jar"))
                return false;
        }

        return true;
    }
}
