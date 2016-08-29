# 구성
## JavaByteCodeExpress
Express Framework로 구현한 웹 프론트입니다.

## JavaByteCodeAnalysis
Spring Framework로 구현한 서버입니다.

# 실행
실행하기 전에 앞서, 하단 **주의사항**을 참고하여 주십시오.  

1. JavaByteCodeExpress를 실행합니다.
2. JavaByteCodeAnalysis를 실행합니다.
3. http://localhost:3000 에 접속합니다.
4. 분석할 *.jar 혹은 *.class를 첨부합니다.
5. Load

# 주의사항
* 해당 프로젝트들은 모두 **IntelliJ IDEA**로 제작되었습니다.  
* 로컬이 아닌 환경에서 사용하실 경우, 두 프로젝트에서 http://localhost를 http://IP로 변경해주세요. 단, Port는 그대로 남겨두세요. ( ex. http://192.168.0.123 )

***

* 프론트를 담당하는 **'JavaByteCodeExpress'**에는 **node_modules**와 **jui**가 업로드되어 있지 않습니다.  
* 따라서 ***npm install***을 진행하시고, ***public***폴더에 ***jui, jui-chart, jui-core, jui-grid***를 설치하여 주십시오.

***
