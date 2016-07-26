var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
    var hash = undefined;
    if (req.cookies.jbcanalysis == undefined) {
        var crypto = require('crypto');
        var current_date = (new Date()).valueOf().toString();
        var random = Math.random().toString();
        hash = crypto.createHash('md5').update(current_date + random).digest('hex');

        res.cookie('jbcanalysis', hash, {expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), httpOnly: true}); // ms 단위
        console.log("생성됨");
    } else {
        hash = req.cookies.jbcanalysis;
        console.log("이미 있음 : " + hash);
        res.cookie('jbcanalysis', hash, {expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), httpOnly: true});
        console.log("갱신됨 : " + req.cookies.jbcanalysis);
    }

    // res.clearCookie('jbcanalysis'); // 쿠키 삭제

    res.render('index', {title: 'JavaByteCode Analysis', hash: hash});
});

module.exports = router;
