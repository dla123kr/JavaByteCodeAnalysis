package controller;

import function.HandleJBC;
import org.springframework.web.bind.annotation.*;

@RestController
@CrossOrigin(origins = "http://192.168.0.203:3000")
public class ClearController {

    @RequestMapping(path = "/clear", method = RequestMethod.GET)
    public void clear(@RequestParam("hash") String hash) {
        HandleJBC.getAllNodesSet().remove(hash);
    }
}
