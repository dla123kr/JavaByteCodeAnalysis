package controller;

import function.StaticDatas;
import org.apache.log4j.Logger;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

/**
 * Created by LimSJ on 2016-07-15.
 */
@RestController
@CrossOrigin(origins = "http://localhost:3000")
public class ClearController {

    private static Logger log = Logger.getLogger(ClearController.class);

    @RequestMapping(path="/clear", method = RequestMethod.GET)
    public String clear(){
        StaticDatas.getJBCClassHashtable().clear();
        log.info("success JBCClassHashtable clear");

        return "clearOK";
    }
}
