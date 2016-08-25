package controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import function.HandleJBC;
import model.Filter;
import model.Node;
import org.apache.log4j.Logger;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@RestController
@CrossOrigin(origins = "http://192.168.0.172:3000")
public class IndexController {
    private static final Logger log = Logger.getLogger(IndexController.class);

    /**
     * 처음 접속 시 table에 생성해주고 null 반환
     * 아닌 경우 값 리턴
     *
     * @param hash
     * @return
     */
    @RequestMapping(path = "/index", method = RequestMethod.GET)
    public ArrayList<Node> index(@RequestParam("hash") String hash) {
        if (!HandleJBC.getAllNodesSet().containsKey(hash)) {
            ArrayList<Node> nodes = new ArrayList<>();

            HandleJBC.getAllNodesSet().put(hash, nodes);
            log.info("새로운 쿠키 생성 : " + hash);
            return null;
        }

        log.info("입장 : " + hash);
        return HandleJBC.getAllNodesSet().get(hash);
    }

    @RequestMapping(path = "/loadFilter", method = RequestMethod.GET)
    public ArrayList<Filter> loadFilter(@RequestParam("hash") String hash) {
        if (HandleJBC.getAllFiltersSet().containsKey(hash))
            return HandleJBC.getAllFiltersSet().get(hash);
        else
            return new ArrayList<>();
    }

    @RequestMapping(path = "/saveFilter", method = RequestMethod.POST)
    public String saveFilter(@RequestParam("hash") String hash, @RequestParam("filters") String filterJSON) {
        ObjectMapper mapper = new ObjectMapper();
        ArrayList<Filter> filters = null;
        try {
            filters = mapper.readValue(filterJSON, new TypeReference<ArrayList<Filter>>() {
            });
            HandleJBC.getAllFiltersSet().put(hash, filters);
        } catch (IOException e) {
            e.printStackTrace();
        }

        return "{}";
    }
}
