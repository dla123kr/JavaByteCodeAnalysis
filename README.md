# 자바바이트코드 분석기

## 1. 구성
이 프로젝트는 Back-end인 JavaByteCodeAnalysis와 Front-end인 JavaByteCodeExpress로 이루어져 있다.

### 1.1. JavaByteCodeAnalysis
Spring Framework로 구현한 Back-end이다.

### 1.2. JavaByteCodeExpress
Express Framework로 구현한 Front-end이다.

## 2. 실행
실행하기 전에 앞서, 하단 **주의사항**을 참고하십시오.

1. JavaByteCodeExpress를 실행한다.
2. JavaByteCodeAnalysis를 실행한다.
3. http://localhost:3000 에 접속한다.
(혹은 http://서버 IP:3000, 이를 사용하기 위해선 **주의사항**을 참고하십시오.)
4. 분석할 *.jar 혹은 *.class를 첨부한다.
5. Load

## 3. 창
자바바이트코드 분석기는 2개의 창으로 이루어져 있다. main화면과 리모콘이다.

### 3.1. main화면
main화면에서는 분석할 파일(*.jar, *.class)을 업로드 할 수 있고, Topology를 볼 수 있다.

### 3.2. 리모콘
리모콘은 업로드한 파일을 Package들을 Directory형식으로 정리해서 보여주는 Package Tree와 Class의 자세한 정보를 보여주는 Details Table로 구성되어 있다.  
Details Table에서 Class의 자세한 정보를 볼 수 있고, Topology 버튼을 클릭하게 되면 해당 Class 혹은 Method의 Topology를 볼 수 있다.

## 4. 주의사항
프로젝트를 실행하기에 앞서 숙지 및 참고하십시오.
* 해당 프로젝트들은 모두 [**IntelliJ IDEA**](https://www.jetbrains.com/idea/)로 제작되었다.
* Front-end인 **'JavaByteCodeExpress'**에는 *node_modules*와 [*jui*](http://github.com/juijs)가 업로드 되어있지 않다.  
따라서, ***npm install***을 진행하고, ***public***폴더에 ***jui, jui-chart, jui-core, jui-grid***를 설치한다.
* 로컬이 아닌 환경에서 사용할 경우, 두 프로젝트에서 http://localhost를 http://IP로 변경한다.  
단, Port는 그대로 남겨둔다. ( ex. http://localhost -> http://192.168.0.123 )
