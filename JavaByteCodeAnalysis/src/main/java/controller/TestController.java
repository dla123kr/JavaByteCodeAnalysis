package controller;

import model.JBCClass;
import model.JBCField;
import model.JBCMethod;
import org.springframework.ui.ModelMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.MultipartHttpServletRequest;
import org.springframework.web.multipart.commons.CommonsFileUploadSupport;
import org.springframework.web.multipart.commons.CommonsMultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.*;

/**
 * Created by LimSJ on 2016-07-07.
 */
@RestController
@CrossOrigin(origins = "http://localhost:3000")
public class TestController {

    @RequestMapping(path = "/fileUpload", method = RequestMethod.POST)
    public String fileLoaded(@RequestParam("uploadFile") MultipartFile[] files){
//        String fileName = file.getOriginalFilename();
//        System.out.println(file);
//        System.out.println(file.getOriginalFilename());
//        File f = new File("d:\\" + fileName);
//
//        try {
//            file.transferTo(f);
//        } catch (IOException e) {
//            System.err.println("파일업로드 에러");
//            e.printStackTrace();
//        }

        for(MultipartFile file : files){
            String fileName = file.getOriginalFilename();
            String[] splittedFileNames = fileName.split("\\.");
            String ext = null;
            if(splittedFileNames.length > 1)
                ext = splittedFileNames[splittedFileNames.length - 1].toLowerCase();

            System.out.println("============");
            System.out.println("파일이름: " + fileName);
            System.out.println("확장자: " + ext);
        }

        // JSON을 보내서, JS에서 처리하자
        return "ok";
    }
}
