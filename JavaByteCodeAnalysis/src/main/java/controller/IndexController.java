package controller;

import function.HandleJBC;
import model.Node;
import org.apache.log4j.Logger;
import org.springframework.web.bind.annotation.*;
import util.Pair;

import java.util.AbstractMap;
import java.util.ArrayList;

/**
 * Created by LimSJ on 2016-07-25.
 */
@RestController
@CrossOrigin(origins = "http://192.168.0.203:3000")
public class IndexController {
    private static final Logger log = Logger.getLogger(IndexController.class);

    /**
     * 처음 접속 시 table에 생성해주고 null 반환
     * 아닌 경우 0번째 리턴
     *
     * @param hash
     * @return
     */
    @RequestMapping(path = "/index", method = RequestMethod.GET)
    public ArrayList<Node> index(@RequestParam("hash") String hash) {
        if (!HandleJBC.getAllNodesSet().containsKey(hash)) {
            ArrayList<Node> nodes = new ArrayList<>();

            HandleJBC.getAllNodesSet().put(hash, nodes);
            return null;
        }

        return HandleJBC.getAllNodesSet().get(hash);
    }
}
