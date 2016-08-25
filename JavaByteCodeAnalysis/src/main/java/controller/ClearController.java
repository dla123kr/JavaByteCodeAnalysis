package controller;

import function.HandleJBC;
import org.apache.log4j.Logger;
import org.springframework.web.bind.annotation.*;

@RestController
@CrossOrigin(origins = "http://192.168.0.172:3000")
public class ClearController {

    private static final Logger log = Logger.getLogger(ClearController.class);

    @RequestMapping(path = "/clear", method = RequestMethod.GET)
    public void clear(@RequestParam("hash") String hash) {
        HandleJBC.getAllNodesSet().remove(hash);
        log.info("기존 데이터 제거 : " + hash);
    }
}
